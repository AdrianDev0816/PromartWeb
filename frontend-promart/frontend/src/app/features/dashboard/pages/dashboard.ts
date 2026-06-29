import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgxEchartsDirective } from 'ngx-echarts';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { ProductoService } from '../../productos/services/producto.service';
import { MovimientoService } from '../../movimientos/services/movimiento.service';
import { MovimientoResponseDto } from '../../movimientos/models/movimiento.model';
import { ProductoDto } from '../../productos/models/producto.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NgxEchartsDirective],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {

  private productoService   = inject(ProductoService);
  private movimientoService = inject(MovimientoService);
  Math = Math;

  // ─── Búsqueda tabla ──────────────────────────────────
  searchTerm  = signal('');
  currentPage = signal(1);
  readonly itemsPerPage = 4;

  // ─── Queries (comparten cache con otros módulos) ──────
  productosQuery = injectQuery(() => ({
    queryKey: ['productos'],
    queryFn:  () => firstValueFrom(this.productoService.listarProductos()),
  }));

  bajoStockQuery = injectQuery(() => ({
    queryKey: ['productos', 'bajo-stock'],
    queryFn:  () => firstValueFrom(this.productoService.listarBajoStock()),
  }));

  movimientosQuery = injectQuery(() => ({
    queryKey: ['movimientos'],
    queryFn:  () => firstValueFrom(this.movimientoService.listarMovimientos()),
  }));

  // ─── Métricas cards ───────────────────────────────────
  totalProductos = computed(() => this.productosQuery.data()?.length ?? 0);

  bajoStockCount = computed(() => this.bajoStockQuery.data()?.length ?? 0);

  proveedoresUnicos = computed(() => {
    const nombres = new Set(
      (this.productosQuery.data() ?? [])
        .map(p => p.proveedor)
        .filter(Boolean)
    );
    return nombres.size;
  });

  private hoy = new Date().toISOString().split('T')[0];

  entradasHoy = computed(() =>
    (this.movimientosQuery.data() ?? [])
      .filter(m => m.tipo === 'Entrada' && m.fecha === this.hoy)
      .reduce((s, m) => s + m.cantidad, 0)
  );

  salidasHoy = computed(() =>
    (this.movimientosQuery.data() ?? [])
      .filter(m => m.tipo === 'Salida' && m.fecha === this.hoy)
      .reduce((s, m) => s + m.cantidad, 0)
  );

  movimientosHoy = computed(() => this.entradasHoy() + this.salidasHoy());

  // ─── Alertas bajo stock (top 4) ──────────────────────
  alertasBajoStock = computed(() =>
    (this.bajoStockQuery.data() ?? []).slice(0, 4)
  );

  stockPct(p: ProductoDto): number {
    if (!p.stockMinimo) return 0;
    return Math.min(Math.round((p.stockActual / p.stockMinimo) * 100), 100);
  }

  // ─── Gráfico barras — últimos 6 meses ─────────────────
  private getLast6Months(): string[] {
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return months;
  }

  private MONTH_LABELS: Record<string, string> = {
    '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
    '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
    '09': 'Set', '10': 'Oct', '11': 'Nov', '12': 'Dic'
  };

  chartData = computed(() => {
    const movs = this.movimientosQuery.data() ?? [];
    return this.getLast6Months().map(ym => {
      const [, m] = ym.split('-');
      return {
        label: this.MONTH_LABELS[m] ?? m,
        entradas: movs.filter(mv => mv.tipo === 'Entrada' && mv.fecha.startsWith(ym))
                      .reduce((s, mv) => s + mv.cantidad, 0),
        salidas:  movs.filter(mv => mv.tipo === 'Salida'  && mv.fecha.startsWith(ym))
                      .reduce((s, mv) => s + mv.cantidad, 0),
      };
    });
  });

  barChartOption = computed(() => {
    const data = this.chartData();
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        borderRadius: 8,
        padding: [10, 14],
        formatter: (params: any[]) => {
          const label = params[0]?.axisValue ?? '';
          let html = `<div style="font-weight:700;color:#f8fafc;margin-bottom:8px;font-size:13px">${label}</div>`;
          for (const p of params) {
            html += `<div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#e2e8f0;margin-top:4px">
              <span style="width:10px;height:10px;border-radius:2px;background:${p.color};display:inline-block"></span>
              <span style="flex:1">${p.seriesName}</span>
              <strong>${p.value}</strong>
            </div>`;
          }
          return html;
        }
      },
      grid: { top: 16, right: 16, bottom: 32, left: 50 },
      xAxis: {
        type: 'category',
        data: data.map(d => d.label),
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisTick: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 12 }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }
      },
      series: [
        {
          name: 'Entradas',
          type: 'bar',
          barMaxWidth: 28,
          itemStyle: { color: '#1D9E75', borderRadius: [4, 4, 0, 0] },
          data: data.map(d => d.entradas)
        },
        {
          name: 'Salidas',
          type: 'bar',
          barMaxWidth: 28,
          itemStyle: { color: '#C8102E', borderRadius: [4, 4, 0, 0] },
          data: data.map(d => d.salidas)
        }
      ]
    };
  });

  // ─── Tabla últimos movimientos ─────────────────────────
  recentMovimientos = computed(() =>
    [...(this.movimientosQuery.data() ?? [])]
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || (b.id - a.id))
      .slice(0, 20)
  );

  movimientosFiltrados = computed(() => {
    const all  = this.recentMovimientos();
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return all;
    return all.filter(m =>
      m.productoNombre.toLowerCase().includes(term) ||
      m.productoCategoria.toLowerCase().includes(term)
    );
  });

  totalPages = computed(() =>
    Math.ceil(this.movimientosFiltrados().length / this.itemsPerPage) || 1
  );

  movimientosPaginados = computed(() => {
    const s = (this.currentPage() - 1) * this.itemsPerPage;
    return this.movimientosFiltrados().slice(s, s + this.itemsPerPage);
  });

  prevPage(): void { if (this.currentPage() > 1) this.currentPage.update(p => p - 1); }
  nextPage(): void { if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1); }

  // ─── Helpers ──────────────────────────────────────────
  formatFecha(fecha: string): string {
    if (!fecha) return '';
    const [, m, d] = fecha.split('-');
    return `${d}/${m}`;
  }

  prefijoCantidad(m: MovimientoResponseDto): string {
    return m.tipo === 'Entrada' ? '+' : m.tipo === 'Salida' ? '-' : '';
  }
}
