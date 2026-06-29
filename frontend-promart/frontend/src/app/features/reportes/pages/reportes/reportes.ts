import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxEchartsDirective } from 'ngx-echarts';
import { MovimientoService } from '../../../movimientos/services/movimiento.service';
import { MovimientoResponseDto, ReporteMovimientoDto } from '../../../movimientos/models/movimiento.model';

interface CategoriaLinea {
  nombre: string;
  color: string;
  activa: boolean;
  datos: number[];
}

interface DonutItem {
  value: number;
  name: string;
  color: string;
  itemStyle: { color: string };
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxEchartsDirective],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css'
})
export class Reportes implements OnInit {

  private movimientoService = inject(MovimientoService);
  Math = Math;

  filtros = {
    motivo: '',
    desde: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    hasta:  new Date().toISOString().split('T')[0]
  };

  // ─── Estado ───────────────────────────────────────────
  cargando    = signal(false);
  errorMsg    = signal<string | null>(null);
  reporte     = signal<ReporteMovimientoDto | null>(null);
  rangoLabel  = signal('');

  // ─── Paginación ───────────────────────────────────────
  currentPage = signal(1);
  readonly itemsPerPage = 10;

  // ─── Computed ─────────────────────────────────────────
  movimientos = computed(() => this.reporte()?.movimientos ?? []);

  movimientosPaginados = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return this.movimientos().slice(start, start + this.itemsPerPage);
  });

  totalPages = computed(() =>
    Math.ceil(this.movimientos().length / this.itemsPerPage) || 1
  );

  totalMonto    = computed(() => this.reporte()?.total ?? 0);
  etiquetaTotal = computed(() => this.reporte()?.etiquetaTotal ?? 'Total');
  mostrarTotal  = computed(() => this.reporte()?.mostrarTotal ?? false);

  productosDistintos = computed(() => {
    const ids = new Set(this.movimientos().map(m => m.productoId));
    return ids.size;
  });

  paginacionDesde = computed(() =>
    this.movimientos().length === 0 ? 0
      : (this.currentPage() - 1) * this.itemsPerPage + 1
  );
  paginacionHasta = computed(() =>
    Math.min(this.currentPage() * this.itemsPerPage, this.movimientos().length)
  );

  // ─── Gráficos ─────────────────────────────────────────
  private diasEje:    string[] = [];
  private diasFechas: string[] = [];

  private readonly COLORES_CAT = [
    '#378ADD', '#D4537E', '#639922', '#BA7517',
    '#1D9E75', '#7F77DD', '#f97316', '#06b6d4',
    '#ec4899', '#84cc16',
  ];

  categorias: CategoriaLinea[] = [];

  donutData: DonutItem[] = [
    { value: 0, name: 'Sin datos', color: '#cbd5e1', itemStyle: { color: '#cbd5e1' } },
  ];

  donutCentro      = { linea1: '...', linea2: '' };
  lineChartOption: any = {};
  donutOption: any     = {};

  // ─── Lifecycle ────────────────────────────────────────
  ngOnInit(): void {
    this.lineChartOption = this.buildLineOption();
    this.donutOption     = this.buildDonutOption();
    this.generarReporte();
  }

  // ─── Acciones ─────────────────────────────────────────
  generarReporte(): void {
    this.cargando.set(true);
    this.errorMsg.set(null);
    this.currentPage.set(1);
    this.rangoLabel.set(this.calcularRangoLabel());

    this.movimientoService.obtenerReporte(
      this.filtros.motivo   || undefined,
      this.filtros.desde    || undefined,
      this.filtros.hasta    || undefined
    ).subscribe({
      next: (data) => {
        this.reporte.set(data);
        this.cargando.set(false);
        this.actualizarDonut(data.movimientos);
        this.procesarDatosGrafico(data.movimientos);
      },
      error: () => {
        this.errorMsg.set('Error al generar el reporte. Verifica que el backend esté activo.');
        this.cargando.set(false);
      }
    });
  }

  prevPage(): void { if (this.currentPage() > 1) this.currentPage.update(p => p - 1); }
  nextPage(): void { if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1); }

  exportarExcel(): void {
    const movs = this.movimientos();
    if (!movs.length) return;

    const encabezados = ['Fecha', 'Producto', 'Código', 'Categoría', 'Tipo', 'Motivo', 'Cantidad', 'Precio Unit.', 'Total', 'Usuario', 'Observaciones'];
    const filas = movs.map(m => [
      this.formatearFecha(m.fecha ?? ''),
      (m.productoNombre ?? '').replace(/"/g, '""'),
      m.productoCodigoSerie ?? '',
      m.productoCategoria ?? '',
      m.tipo ?? '',
      m.motivo ?? '',
      m.tipo === 'Salida' ? -m.cantidad : m.cantidad,
      (m.precioUnitario ?? 0).toFixed(2),
      (m.precioTotal ?? 0).toFixed(2),
      m.trabajador ?? '',
      (m.observaciones ?? '').replace(/"/g, '""')
    ]);

    const csvContent = [encabezados, ...filas]
      .map(row => row.map(v => `"${v}"`).join(';'))
      .join('\r\n');

    const bom = '﻿';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    const rango = this.rangoLabel() || 'reporte';
    a.href     = url;
    a.download = `movimientos_${rango.replace(/\s|–/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  toggleCategoria(cat: CategoriaLinea): void {
    cat.activa = !cat.activa;
    this.lineChartOption = { ...this.buildLineOption() };
  }

  onDonutHover(params: any): void {
    if (params?.name) {
      this.donutCentro = { linea1: params.name, linea2: params.value + '%' };
    }
  }

  onDonutMouseout(): void {
    this.donutCentro = { linea1: this.movimientos().length + '', linea2: 'movs.' };
  }

  // ─── Helpers de visualización ─────────────────────────
  cantidadMostrar(m: MovimientoResponseDto): number {
    return m.tipo === 'Salida' ? -m.cantidad : m.cantidad;
  }

  badgeClass(motivo: string | null): string {
    switch (motivo) {
      case 'Venta':      return 'badge-venta';
      case 'Merma':      return 'badge-merma';
      case 'Entrada':    return 'badge-entrada';
      case 'Devolucion': return 'badge-devolucion';
      default:           return 'badge-otro';
    }
  }

  badgeLabel(motivo: string | null, tipo: string): string {
    return motivo ?? tipo;
  }

  formatearFecha(iso: string): string {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  pillBg(cat: CategoriaLinea):     string { return cat.activa ? cat.color + '2a' : 'transparent'; }
  pillBorder(cat: CategoriaLinea): string { return cat.activa ? cat.color : '#334155'; }
  pillColor(cat: CategoriaLinea):  string { return cat.activa ? cat.color : '#64748b'; }

  // ─── Internos ─────────────────────────────────────────
  private calcularRangoLabel(): string {
    const { desde, hasta } = this.filtros;
    if (desde && hasta) return `${this.formatearFecha(desde)} – ${this.formatearFecha(hasta)}`;
    if (desde) return `Desde ${this.formatearFecha(desde)}`;
    if (hasta) return `Hasta ${this.formatearFecha(hasta)}`;
    return 'Todos los períodos';
  }

  private actualizarDonut(movimientos: MovimientoResponseDto[]): void {
    if (!movimientos.length) {
      this.donutData = [{ value: 100, name: 'Sin datos', color: '#cbd5e1', itemStyle: { color: '#cbd5e1' } }];
      this.donutCentro = { linea1: '0', linea2: 'movs.' };
      this.donutOption = { ...this.buildDonutOption() };
      return;
    }

    const colores: Record<string, string> = {
      Venta: '#C8102E', Entrada: '#1D9E75', Merma: '#BA7517',
      Devolucion: '#378ADD', Ajuste: '#7F77DD', Transferencia: '#f97316',
    };
    const etiquetas: Record<string, string> = {
      Venta: 'Venta', Entrada: 'Entrada', Merma: 'Merma',
      Devolucion: 'Devolución', Ajuste: 'Ajuste', Transferencia: 'Transferencia',
    };

    const conteo: Record<string, number> = {};
    for (const m of movimientos) {
      const key = m.motivo ?? m.tipo;
      conteo[key] = (conteo[key] ?? 0) + 1;
    }

    const total = movimientos.length;
    this.donutData = Object.entries(conteo).map(([key, count]) => {
      const color = colores[key] ?? '#5F5E5A';
      return {
        value: Math.round((count / total) * 100),
        name:  etiquetas[key] ?? key,
        color,
        itemStyle: { color }
      };
    });

    this.donutCentro = { linea1: total + '', linea2: 'movs.' };
    this.donutOption = { ...this.buildDonutOption() };
  }

  private procesarDatosGrafico(movimientos: MovimientoResponseDto[]): void {
    if (!movimientos.length) {
      this.diasEje    = [];
      this.diasFechas = [];
      this.categorias = [];
      this.lineChartOption = { ...this.buildLineOption() };
      return;
    }

    // Fechas únicas ordenadas (yyyy-mm-dd)
    const fechasOrdenadas = [...new Set(movimientos.map(m => m.fecha.substring(0, 10)))].sort();

    this.diasEje    = fechasOrdenadas.map(f => `Día ${parseInt(f.split('-')[2], 10)}`);
    this.diasFechas = fechasOrdenadas.map(f => {
      const [, mm, dd] = f.split('-');
      return `${dd}/${mm}`;
    });

    // Categorías únicas del resultado real
    const cats = [...new Set(movimientos.map(m => m.productoCategoria).filter(Boolean))].sort();

    this.categorias = cats.map((nombre, idx) => ({
      nombre,
      color:  this.COLORES_CAT[idx % this.COLORES_CAT.length],
      activa: true,
      datos:  fechasOrdenadas.map(fecha =>
        movimientos
          .filter(m => m.productoCategoria === nombre && m.fecha.startsWith(fecha))
          .reduce((sum, m) => sum + m.cantidad, 0)
      ),
    }));

    this.lineChartOption = { ...this.buildLineOption() };
  }

  private buildLineOption(): any {
    const fechas = this.diasFechas;
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { type: 'dashed', color: '#475569', width: 1 } },
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        borderRadius: 8,
        padding: [10, 14],
        extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.4)',
        formatter: (params: any[]) => {
          if (!params?.length) return '';
          const day = params[0].axisValue;
          const fecha = fechas[params[0].dataIndex] ?? '';
          let html = `<div style="font-weight:700;margin-bottom:8px;color:#f8fafc;font-size:13px">${day} (${fecha})</div>`;
          for (const p of params) {
            html += `<div style="display:flex;align-items:center;gap:8px;margin-top:4px;color:#e2e8f0;font-size:12px">
              <span style="width:8px;height:8px;border-radius:50%;background:${p.color};flex-shrink:0;display:inline-block"></span>
              <span style="flex:1;min-width:80px">${p.seriesName}</span>
              <span style="font-weight:700">${p.value}</span>
            </div>`;
          }
          return html;
        }
      },
      grid: { top: 16, right: 20, bottom: 40, left: 44 },
      xAxis: {
        type: 'category',
        data: this.diasEje,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisTick: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 11, rotate: this.diasEje.length > 15 ? 30 : 0 }
      },
      yAxis: (() => {
        const allValues = this.categorias.flatMap(c => c.datos);
        const maxVal    = allValues.length ? Math.max(...allValues) : 10;
        const yMax      = Math.max(Math.ceil(maxVal / 5) * 5, 10);
        const interval  = Math.max(Math.ceil(yMax / 5), 1);
        return {
          type: 'value', min: 0, max: yMax, interval,
          axisLine: { show: false }, axisTick: { show: false },
          axisLabel: { color: '#94a3b8', fontSize: 11 },
          splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9', width: 1 } }
        };
      })(),
      series: this.categorias.filter(c => c.activa).map(c => ({
        name: c.nombre, type: 'line', smooth: 0.5,
        symbol: 'circle', symbolSize: 7, showSymbol: true,
        label: { show: false },
        lineStyle: { color: c.color, width: 2.5 },
        itemStyle: { color: c.color, borderColor: '#ffffff', borderWidth: 2 },
        data: c.datos
      }))
    };
  }

  private buildDonutOption(): any {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        borderRadius: 8,
        padding: [8, 14],
        formatter: (params: any) =>
          `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${params.color};margin-right:6px"></span>` +
          `<span style="color:#e2e8f0">${params.name}</span>&nbsp;&nbsp;<strong style="color:#f8fafc">${params.value}%</strong>`
      },
      legend: { show: false },
      series: [{
        type: 'pie',
        radius: ['42%', '72%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#ffffff', borderWidth: 2 },
        label: { show: false },
        emphasis: { scale: true, scaleSize: 7, itemStyle: { shadowBlur: 16, shadowColor: 'rgba(0,0,0,0.25)' } },
        data: this.donutData
      }]
    };
  }
}
