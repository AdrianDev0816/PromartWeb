import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom, Subscription } from 'rxjs';
import { OrdenCompraService } from '../../services/orden-compra.service';
import { AuthService } from '../../../../core/services/auth.service';
import { OrdenCompraDto } from '../../models/orden-compra.model';
import { WebSocketService } from '../../../../core/services/websocket.service';

@Component({
  selector: 'app-lista-ordenes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-ordenes.html',
  styleUrl: './lista-ordenes.css'
})
export class ListaOrdenes implements OnDestroy {

  private svc         = inject(OrdenCompraService);
  private authService = inject(AuthService);
  private queryClient = inject(QueryClient);
  private wsService   = inject(WebSocketService);
  private wsSub       = new Subscription();

  // ── Data ─────────────────────────────────────────────────────────────────
  query = injectQuery(() => ({
    queryKey: ['ordenes'],
    queryFn:  () => firstValueFrom(this.svc.listar()),
  }));

  // ── Filters ───────────────────────────────────────────────────────────────
  filtroEstado     = signal('');
  filtroProveedor  = signal('');
  filtroDesde      = signal('');
  filtroHasta      = signal('');

  // ── Pagination ────────────────────────────────────────────────────────────
  paginaActual = signal(1);
  readonly POR_PAGINA = 10;

  // ── Panel de evaluación ───────────────────────────────────────────────────
  ordenSeleccionada = signal<OrdenCompraDto | null>(null);
  panelAbierto      = signal(false);
  comentario        = signal('');
  errorPanel        = signal('');

  // ── Toast ─────────────────────────────────────────────────────────────────
  toastMsg  = signal('');
  toastTipo = signal<'ok'|'err'>('ok');
  toastVisible = signal(false);

  // ── Role ──────────────────────────────────────────────────────────────────
  cargo = this.authService.getCargo();
  esAdmin      = this.cargo === 'Administrador';
  esSupervisor = this.cargo === 'Supervisor' || this.cargo === 'Administrador';

  // ── Computed: lista filtrada ──────────────────────────────────────────────
  ordenesFiltradas = computed(() => {
    let lista = this.query.data() ?? [];
    const est  = this.filtroEstado();
    const prov = this.filtroProveedor().toLowerCase();
    const desde = this.filtroDesde();
    const hasta = this.filtroHasta();
    if (est)   lista = lista.filter(o => o.estado === est);
    if (prov)  lista = lista.filter(o => o.proveedorNombre.toLowerCase().includes(prov));
    if (desde) lista = lista.filter(o => o.fechaEmision >= desde);
    if (hasta) lista = lista.filter(o => o.fechaEmision <= hasta);
    return lista;
  });

  ordenesPaginadas = computed(() => {
    const from = (this.paginaActual() - 1) * this.POR_PAGINA;
    return this.ordenesFiltradas().slice(from, from + this.POR_PAGINA);
  });

  totalPaginas = computed(() =>
    Math.ceil(this.ordenesFiltradas().length / this.POR_PAGINA) || 1);

  // ── Computed: métricas ────────────────────────────────────────────────────
  totalOrdenes  = computed(() => this.query.data()?.length ?? 0);
  pendientes    = computed(() => this.query.data()?.filter(o => o.estado === 'Pendiente').length ?? 0);
  aprobadas     = computed(() => this.query.data()?.filter(o => o.estado === 'Aprobada').length ?? 0);
  rechazadas    = computed(() => this.query.data()?.filter(o => o.estado === 'Rechazada').length ?? 0);

  desde = computed(() => (this.paginaActual() - 1) * this.POR_PAGINA + 1);
  hasta = computed(() => Math.min(this.paginaActual() * this.POR_PAGINA, this.ordenesFiltradas().length));

  // ── Mutations ─────────────────────────────────────────────────────────────
  mutAprobar = injectMutation(() => ({
    mutationFn: ({ id, comentario }: { id: number; comentario: string }) =>
      firstValueFrom(this.svc.aprobar(id, { comentario })),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['ordenes'] });
      this.cerrarPanel();
      this.mostrarToast('Orden aprobada correctamente', 'ok');
    },
    onError: (e: any) => this.errorPanel.set(e?.error?.message ?? 'Error al aprobar')
  }));

  mutRechazar = injectMutation(() => ({
    mutationFn: ({ id, comentario }: { id: number; comentario: string }) =>
      firstValueFrom(this.svc.rechazar(id, { comentario })),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['ordenes'] });
      this.cerrarPanel();
      this.mostrarToast('Orden rechazada', 'err');
    },
    onError: (e: any) => this.errorPanel.set(e?.error?.message ?? 'Debe indicar el motivo')
  }));

  mutCompletar = injectMutation(() => ({
    mutationFn: (id: number) => firstValueFrom(this.svc.completar(id)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['ordenes'] });
      this.queryClient.invalidateQueries({ queryKey: ['productos'] });
      this.cerrarPanel();
      this.mostrarToast('Orden completada — entradas de inventario generadas', 'ok');
    },
    onError: (e: any) => this.errorPanel.set(e?.error?.message ?? 'Error al completar')
  }));

  mutCancelar = injectMutation(() => ({
    mutationFn: (id: number) => firstValueFrom(this.svc.cancelar(id)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['ordenes'] });
      this.cerrarPanel();
      this.mostrarToast('Orden cancelada', 'ok');
    },
    onError: (e: any) => this.errorPanel.set(e?.error?.message ?? 'Error al cancelar')
  }));

  constructor() {
    // Refrescar lista cuando llega evento de orden vía WebSocket
    this.wsSub.add(
      this.wsService.notificaciones$().subscribe(n => {
        if (n.mensaje?.toLowerCase().includes('orden')) {
          this.queryClient.invalidateQueries({ queryKey: ['ordenes'] });
        }
      })
    );
  }

  ngOnDestroy(): void { this.wsSub.unsubscribe(); }

  // ── Acciones ──────────────────────────────────────────────────────────────
  abrirPanel(o: OrdenCompraDto): void {
    this.ordenSeleccionada.set(o);
    this.comentario.set('');
    this.errorPanel.set('');
    this.panelAbierto.set(true);
  }

  cerrarPanel(): void {
    this.panelAbierto.set(false);
    this.ordenSeleccionada.set(null);
  }

  aprobar(): void {
    const o = this.ordenSeleccionada();
    if (!o) return;
    this.errorPanel.set('');
    this.mutAprobar.mutate({ id: o.id, comentario: this.comentario() });
  }

  rechazar(): void {
    const o = this.ordenSeleccionada();
    if (!o) return;
    if (!this.comentario().trim()) {
      this.errorPanel.set('El motivo de rechazo es obligatorio');
      return;
    }
    this.errorPanel.set('');
    this.mutRechazar.mutate({ id: o.id, comentario: this.comentario() });
  }

  completar(): void {
    const o = this.ordenSeleccionada();
    if (!o) return;
    this.errorPanel.set('');
    this.mutCompletar.mutate(o.id);
  }

  cancelar(): void {
    const o = this.ordenSeleccionada();
    if (!o) return;
    this.errorPanel.set('');
    this.mutCancelar.mutate(o.id);
  }

  filtrar(): void { this.paginaActual.set(1); }
  limpiar(): void {
    this.filtroEstado.set('');
    this.filtroProveedor.set('');
    this.filtroDesde.set('');
    this.filtroHasta.set('');
    this.paginaActual.set(1);
  }

  anteriorPagina(): void {
    if (this.paginaActual() > 1) this.paginaActual.update(p => p - 1);
  }
  siguientePagina(): void {
    if (this.paginaActual() < this.totalPaginas()) this.paginaActual.update(p => p + 1);
  }

  // ── Helpers UI ────────────────────────────────────────────────────────────
  badgeEstado(estado: string): string {
    const map: Record<string, string> = {
      Pendiente: 'badge-pendiente',
      Aprobada:  'badge-aprobada',
      Rechazada: 'badge-rechazada',
      EnProceso: 'badge-en-proceso',
      Completada:'badge-completada',
      Cancelada: 'badge-cancelada',
    };
    return map[estado] ?? 'badge-gris';
  }

  etiquetaEstado(estado: string): string {
    return estado === 'EnProceso' ? 'En proceso' : estado;
  }

  formatFecha(iso: string | null): string {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  formatMonto(n: number | null): string {
    if (n == null) return '—';
    return 'S/ ' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  puedeEvaluar(o: OrdenCompraDto): boolean {
    return o.estado === 'Pendiente' && this.esSupervisor;
  }

  puedeCompletar(o: OrdenCompraDto): boolean {
    return (o.estado === 'Aprobada' || o.estado === 'EnProceso') && this.esAdmin;
  }

  puedeCancelar(o: OrdenCompraDto): boolean {
    return (o.estado === 'Pendiente' || o.estado === 'EnProceso') && this.esAdmin;
  }

  cargando = computed(() =>
    this.mutAprobar.isPending() || this.mutRechazar.isPending() ||
    this.mutCompletar.isPending() || this.mutCancelar.isPending()
  );

  private mostrarToast(msg: string, tipo: 'ok' | 'err'): void {
    this.toastMsg.set(msg);
    this.toastTipo.set(tipo);
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 4000);
  }
}
