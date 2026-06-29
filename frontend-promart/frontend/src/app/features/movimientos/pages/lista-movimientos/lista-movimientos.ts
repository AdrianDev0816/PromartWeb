import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QueryClient, injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { MovimientoService } from '../../services/movimiento.service';
import { MovimientoRequestDto, MovimientoResponseDto } from '../../models/movimiento.model';
import { ProductoService } from '../../../productos/services/producto.service';
import { ProductoDto } from '../../../productos/models/producto.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-lista-movimientos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-movimientos.html',
  styleUrl: './lista-movimientos.css'
})
export class ListaMovimientos {

  private movimientoService = inject(MovimientoService);
  private productoService   = inject(ProductoService);
  private authService       = inject(AuthService);
  private queryClient       = inject(QueryClient);

  private get trabajadorIdActual(): number | null {
    return this.authService.getCurrentUser()?.id ?? null;
  }

  Math = Math;
  readonly itemsPerPage = 8;

  // ─── Filtros ──────────────────────────────────────────
  filtroDesde     = signal('');
  filtroHasta     = signal('');
  filtroMotivo    = signal('');
  filtroTipo      = signal('');
  filtroAplicado  = signal(false);
  currentPage     = signal(1);

  // ─── Modal ────────────────────────────────────────────
  showModalEntrada = signal(false);
  showModalSalida  = signal(false);
  formEntrada: MovimientoRequestDto = this.formEntradaVacio();
  formSalida:  MovimientoRequestDto = this.formSalidaVacio();
  productoEntrada: ProductoDto | null = null;
  productoSalida:  ProductoDto | null = null;

  // ─── Toast ────────────────────────────────────────────
  toast = signal({ visible: false, mensaje: '', tipo: 'success' as 'success' | 'error' });
  private toastTimer: any;

  // ─── Reporte ──────────────────────────────────────────
  reporteTotal        = signal<number | null>(null);
  reporteEtiqueta     = signal('');
  mostrarReporteTotal = signal(false);

  readonly motivosEntrada = [
    { valor: 'Entrada',       label: 'Entrada' },
    { valor: 'Devolucion',    label: 'Devolución' },
    { valor: 'Transferencia', label: 'Transferencia' },
  ];
  readonly motivosSalida = [
    { valor: 'Venta',         label: 'Venta' },
    { valor: 'Merma',         label: 'Merma' },
    { valor: 'Transferencia', label: 'Transferencia' },
  ];
  readonly motivosFiltro = [
    { valor: '', label: 'Todos' },
    { valor: 'Venta',         label: 'Venta' },
    { valor: 'Merma',         label: 'Merma' },
    { valor: 'Entrada',       label: 'Entrada' },
    { valor: 'Devolucion',    label: 'Devolución' },
    { valor: 'Transferencia', label: 'Transferencia' },
    { valor: 'Ajuste',        label: 'Ajuste' },
  ];

  // ─── Queries ──────────────────────────────────────────
  productosQuery = injectQuery(() => ({
    queryKey: ['productos'],
    queryFn:  () => firstValueFrom(this.productoService.listarProductos()),
    staleTime: 5 * 60_000,
  }));

  movimientosQuery = injectQuery(() => {
    const aplicado = this.filtroAplicado();
    const motivo   = this.filtroMotivo();
    const desde    = this.filtroDesde();
    const hasta    = this.filtroHasta();

    if (aplicado && (motivo || desde || hasta)) {
      return {
        queryKey: ['movimientos', 'reporte', { motivo, desde, hasta }],
        queryFn: async () => {
          const r = await firstValueFrom(
            this.movimientoService.obtenerReporte(motivo || undefined, desde || undefined, hasta || undefined)
          );
          this.reporteTotal.set(r.total);
          this.reporteEtiqueta.set(r.etiquetaTotal);
          this.mostrarReporteTotal.set(r.mostrarTotal);
          return r.movimientos;
        },
      };
    }

    return {
      queryKey: ['movimientos'],
      queryFn: () => firstValueFrom(this.movimientoService.listarMovimientos()),
    };
  });

  // ─── Computed ─────────────────────────────────────────
  movimientosFiltrados = computed(() => {
    const all  = this.movimientosQuery.data() ?? [];
    const tipo = this.filtroTipo();
    return tipo ? all.filter(m => m.tipo === tipo) : all;
  });

  totalPages = computed(() =>
    Math.ceil(this.movimientosFiltrados().length / this.itemsPerPage) || 1
  );

  movimientosPaginados = computed(() => {
    const s = (this.currentPage() - 1) * this.itemsPerPage;
    return this.movimientosFiltrados().slice(s, s + this.itemsPerPage);
  });

  entradasHoy = computed(() => {
    const hoy = new Date().toISOString().split('T')[0];
    return (this.movimientosQuery.data() ?? [])
      .filter(m => m.tipo === 'Entrada' && m.fecha === hoy)
      .reduce((s, m) => s + m.cantidad, 0);
  });

  salidasHoy = computed(() => {
    const hoy = new Date().toISOString().split('T')[0];
    return (this.movimientosQuery.data() ?? [])
      .filter(m => m.tipo === 'Salida' && m.fecha === hoy)
      .reduce((s, m) => s + m.cantidad, 0);
  });

  totalMes = computed(() => {
    const mes = new Date().toISOString().substring(0, 7);
    return (this.movimientosQuery.data() ?? [])
      .filter(m => m.fecha.startsWith(mes)).length;
  });

  // ─── Stock helpers ────────────────────────────────────
  get stockNuevoEntrada(): number {
    return (this.productoEntrada?.stockActual ?? 0) + (this.formEntrada.cantidad || 0);
  }
  get stockNuevoSalida(): number {
    return (this.productoSalida?.stockActual ?? 0) - (this.formSalida.cantidad || 0);
  }
  get stockSuficiente(): boolean {
    if (!this.productoSalida) return true;
    return this.productoSalida.stockActual >= (this.formSalida.cantidad || 0);
  }

  // ─── Mutations ────────────────────────────────────────
  entradaMutation = injectMutation(() => ({
    mutationFn: (req: MovimientoRequestDto) =>
      firstValueFrom(this.movimientoService.registrarEntrada(req)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      this.cerrarModalEntrada();
      this.mostrarToast('Entrada registrada correctamente', 'success');
    },
    onError: (err: any) => {
      this.mostrarToast(err?.error?.message || 'Error al registrar entrada.', 'error');
    }
  }));

  salidaMutation = injectMutation(() => ({
    mutationFn: (req: MovimientoRequestDto) =>
      firstValueFrom(this.movimientoService.registrarSalida(req)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      this.cerrarModalSalida();
      this.mostrarToast('Salida registrada correctamente', 'success');
    },
    onError: (err: any) => {
      this.mostrarToast(err?.error?.message || 'Error al registrar salida.', 'error');
    }
  }));

  // ─── Acciones ─────────────────────────────────────────
  filtrar(): void {
    const { motivo, desde, hasta } = { motivo: this.filtroMotivo(), desde: this.filtroDesde(), hasta: this.filtroHasta() };
    this.filtroAplicado.set(!!(motivo || desde || hasta));
    this.currentPage.set(1);
  }

  limpiarFiltros(): void {
    this.filtroDesde.set('');
    this.filtroHasta.set('');
    this.filtroMotivo.set('');
    this.filtroTipo.set('');
    this.filtroAplicado.set(false);
    this.mostrarReporteTotal.set(false);
    this.currentPage.set(1);
  }

  prevPage(): void { if (this.currentPage() > 1) this.currentPage.update(p => p - 1); }
  nextPage(): void { if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1); }

  abrirModalEntrada(): void {
    this.formEntrada = this.formEntradaVacio();
    this.productoEntrada = null;
    this.showModalEntrada.set(true);
  }

  cerrarModalEntrada(): void { this.showModalEntrada.set(false); }

  onProductoEntradaChange(): void {
    this.productoEntrada = (this.productosQuery.data() ?? [])
      .find(p => p.id === +this.formEntrada.productoId!) || null;
  }

  abrirModalSalida(): void {
    this.formSalida = this.formSalidaVacio();
    this.productoSalida = null;
    this.showModalSalida.set(true);
  }

  cerrarModalSalida(): void { this.showModalSalida.set(false); }

  onProductoSalidaChange(): void {
    this.productoSalida = (this.productosQuery.data() ?? [])
      .find(p => p.id === +this.formSalida.productoId!) || null;
  }

  registrarEntrada(): void {
    if (!this.formEntrada.productoId || !this.formEntrada.cantidad) return;
    this.entradaMutation.mutate(this.formEntrada);
  }

  registrarSalida(): void {
    if (!this.formSalida.productoId || !this.formSalida.cantidad) return;
    this.salidaMutation.mutate(this.formSalida);
  }

  // ─── Helpers visuales ────────────────────────────────
  mostrarToast(mensaje: string, tipo: 'success' | 'error'): void {
    clearTimeout(this.toastTimer);
    this.toast.set({ visible: true, mensaje, tipo });
    this.toastTimer = setTimeout(() => this.toast.update(t => ({ ...t, visible: false })), 3500);
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '';
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  }

  displayMotivo(motivo: string | null): string {
    const map: Record<string, string> = {
      Venta: 'Venta', Merma: 'Merma', Entrada: 'Entrada', Salida: 'Salida',
      Devolucion: 'Devolución', Transferencia: 'Transferencia', Ajuste: 'Ajuste'
    };
    return motivo ? (map[motivo] ?? motivo) : '—';
  }

  mostrarPrecio(mov: MovimientoResponseDto): boolean {
    return mov.motivo !== 'Ajuste' && mov.motivo !== 'Transferencia';
  }

  prefijoCantidad(mov: MovimientoResponseDto): string {
    if (mov.tipo === 'Entrada') return '+';
    if (mov.tipo === 'Salida')  return '-';
    return '';
  }

  private formEntradaVacio(): MovimientoRequestDto {
    return { productoId: null, cantidad: 1, trabajadorId: this.trabajadorIdActual, motivo: 'Entrada', observaciones: '' };
  }

  private formSalidaVacio(): MovimientoRequestDto {
    return { productoId: null, cantidad: 1, trabajadorId: this.trabajadorIdActual, motivo: 'Venta', observaciones: '' };
  }
}
