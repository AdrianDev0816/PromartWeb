import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { OrdenCompraService } from '../../services/orden-compra.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { OrdenCompraDto } from '../../models/orden-compra.model';

@Component({
  selector: 'app-mis-ordenes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mis-ordenes.html',
  styleUrl: './mis-ordenes.css'
})
export class MisOrdenes implements OnDestroy {

  private svc         = inject(OrdenCompraService);
  private queryClient = inject(QueryClient);
  private wsService   = inject(WebSocketService);
  private wsSub       = new Subscription();

  query = injectQuery(() => ({
    queryKey: ['mis-ordenes'],
    queryFn:  () => firstValueFrom(this.svc.listarMisOrdenes()),
    refetchInterval: 30000,
  }));

  modalOrden      = signal<OrdenCompraDto | null>(null);
  toastMsg        = signal('');
  toastOk         = signal(true);
  toastVisible    = signal(false);
  confirmandoId   = signal<number | null>(null);

  completarMut = injectMutation(() => ({
    mutationFn: (id: number) => firstValueFrom(this.svc.completar(id)),
    onSuccess: (data) => {
      this.queryClient.invalidateQueries({ queryKey: ['mis-ordenes'] });
      if (this.modalOrden()?.id === (data as any)?.id) {
        this.modalOrden.set(data as OrdenCompraDto);
      }
      this.mostrarToast('Recepción confirmada — stock actualizado', true);
      this.confirmandoId.set(null);
    },
    onError: () => {
      this.mostrarToast('Error al registrar la recepción', false);
      this.confirmandoId.set(null);
    }
  }));

  constructor() {
    this.wsSub.add(
      this.wsService.ordenes$().subscribe(() => {
        this.queryClient.invalidateQueries({ queryKey: ['mis-ordenes'] });
      })
    );
  }

  ngOnDestroy(): void { this.wsSub.unsubscribe(); }

  abrirModal(o: OrdenCompraDto): void { this.modalOrden.set(o); }
  cerrarModal(): void                { this.modalOrden.set(null); }

  confirmarRecepcion(o: OrdenCompraDto): void {
    this.confirmandoId.set(o.id);
    this.completarMut.mutate(o.id);
  }

  private mostrarToast(msg: string, ok: boolean): void {
    this.toastMsg.set(msg);
    this.toastOk.set(ok);
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 3500);
  }

  // ── Computed métricas ─────────────────────────────────────────────────────
  total      = computed(() => this.query.data()?.length ?? 0);
  pendientes = computed(() => this.query.data()?.filter(o => o.estado === 'Pendiente').length ?? 0);
  aprobadas  = computed(() => this.query.data()?.filter(o => o.estado === 'Aprobada' || o.estado === 'EnProceso').length ?? 0);
  completadas= computed(() => this.query.data()?.filter(o => o.estado === 'Completada').length ?? 0);
  rechazadas = computed(() => this.query.data()?.filter(o => o.estado === 'Rechazada' || o.estado === 'Cancelada').length ?? 0);

  // ── Helpers UI ────────────────────────────────────────────────────────────
  badgeClass(estado: string): string {
    const map: Record<string, string> = {
      Pendiente:  'badge-pendiente',
      Aprobada:   'badge-aprobada',
      Rechazada:  'badge-rechazada',
      EnProceso:  'badge-en-proceso',
      Completada: 'badge-completada',
      Cancelada:  'badge-cancelada',
    };
    return map[estado] ?? 'badge-gris';
  }

  etiqueta(estado: string): string {
    return estado === 'EnProceso' ? 'En proceso' : estado;
  }

  iconoEstado(estado: string): string {
    const map: Record<string, string> = {
      Pendiente:  'bi-hourglass-split',
      Aprobada:   'bi-check-circle-fill',
      Rechazada:  'bi-x-circle-fill',
      EnProceso:  'bi-arrow-repeat',
      Completada: 'bi-check2-all',
      Cancelada:  'bi-slash-circle',
    };
    return map[estado] ?? 'bi-circle';
  }

  formatFecha(iso: string | null): string {
    if (!iso) return '—';
    const d = iso.substring(0, 10);
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  }

  formatMonto(n: number | null): string {
    if (n == null) return '—';
    return 'S/ ' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}
