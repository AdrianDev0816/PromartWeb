import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom, Subscription } from 'rxjs';
import { AlertaService } from '../../services/alerta.service';
import { AlertaDto } from '../../models/alerta.model';
import { MovimientoService } from '../../../movimientos/services/movimiento.service';
import { AuthService } from '../../../../core/services/auth.service';
import { WebSocketService } from '../../../../core/services/websocket.service';

type Severidad = 'critico' | 'minimo';
type Filtro = 'todos' | Severidad | 'no-leidas';

interface AlertaVista extends AlertaDto {
  severidad: Severidad;
  porcentaje: number;
  brecha: number;
}

@Component({
  selector: 'app-alertas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alertas.html',
  styleUrl: './alertas.css'
})
export class Alertas implements OnInit, OnDestroy {

  private svc         = inject(AlertaService);
  private movSvc      = inject(MovimientoService);
  private authService = inject(AuthService);
  private wsService   = inject(WebSocketService);
  private qc          = inject(QueryClient);

  filtro       = signal<Filtro>('todos');
  reponerItem  = signal<AlertaVista | null>(null);
  wsNuevas     = signal(0);
  toastMsg     = signal('');
  toastOk      = signal(true);
  toastVisible = signal(false);

  formReponer = { cantidad: 1, observaciones: '' };

  private wsSub = new Subscription();

  // ─── Query ────────────────────────────────────────────
  alertasQuery = injectQuery(() => ({
    queryKey: ['alertas-activas'],
    queryFn:  () => firstValueFrom(this.svc.listarActivas()),
    refetchInterval: 60_000
  }));

  // ─── Computed ─────────────────────────────────────────
  alertas = computed<AlertaVista[]>(() => {
    const raw = this.alertasQuery.data() ?? [];
    return raw.map(a => this.enriquecer(a)).sort((a, b) => {
      if (a.severidad !== b.severidad) return a.severidad === 'critico' ? -1 : 1;
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
  });

  filtradas = computed(() => {
    const f = this.filtro();
    const all = this.alertas();
    if (f === 'no-leidas') return all.filter(a => !a.leida);
    if (f === 'critico')   return all.filter(a => a.severidad === 'critico');
    if (f === 'minimo')    return all.filter(a => a.severidad === 'minimo');
    return all;
  });

  totalCritico  = computed(() => this.alertas().filter(a => a.severidad === 'critico').length);
  totalMinimo   = computed(() => this.alertas().filter(a => a.severidad === 'minimo').length);
  totalNoLeidas = computed(() => this.alertas().filter(a => !a.leida).length);

  // ─── Mutations ────────────────────────────────────────
  reponerMut = injectMutation(() => ({
    mutationFn: (req: { productoId: number; cantidad: number; observaciones: string }) =>
      firstValueFrom(this.movSvc.registrarEntrada({
        productoId:    req.productoId,
        cantidad:      req.cantidad,
        trabajadorId:  this.authService.getCurrentUser()?.id ?? null,
        motivo:        'Entrada',
        observaciones: req.observaciones
      })),
    onSuccess: () => {
      this.qc.invalidateQueries({ queryKey: ['alertas-activas'] });
      this.cerrarModal();
      this.mostrarToast('Reposición registrada correctamente', true);
    },
    onError: () => this.mostrarToast('Error al registrar la reposición', false)
  }));

  marcarLeidaMut = injectMutation(() => ({
    mutationFn: (id: number) => firstValueFrom(this.svc.marcarLeida(id)),
    onSuccess: () => {
      this.qc.invalidateQueries({ queryKey: ['alertas-activas'] });
      this.mostrarToast('Alerta marcada como leída', true);
    },
    onError: () => this.mostrarToast('Error al marcar la alerta', false)
  }));

  resolverMut = injectMutation(() => ({
    mutationFn: (id: number) => firstValueFrom(this.svc.resolver(id)),
    onSuccess: () => {
      this.qc.invalidateQueries({ queryKey: ['alertas-activas'] });
      this.mostrarToast('Alerta resuelta', true);
    },
    onError: () => this.mostrarToast('Error al resolver la alerta', false)
  }));

  marcarTodasLeidasMut = injectMutation(() => ({
    mutationFn: () => firstValueFrom(this.svc.marcarTodasLeidas()),
    onSuccess: () => {
      this.qc.invalidateQueries({ queryKey: ['alertas-activas'] });
      this.mostrarToast('Todas las alertas marcadas como leídas', true);
    },
    onError: () => this.mostrarToast('Error al marcar las alertas', false)
  }));

  // ─── Lifecycle ────────────────────────────────────────
  ngOnInit(): void {
    this.wsSub.add(
      this.wsService.alertas$().subscribe(() => {
        this.wsNuevas.update(n => n + 1);
        this.qc.invalidateQueries({ queryKey: ['alertas-activas'] });
      })
    );
  }

  ngOnDestroy(): void {
    this.wsSub.unsubscribe();
  }

  // ─── Helpers ──────────────────────────────────────────
  private enriquecer(a: AlertaDto): AlertaVista {
    const severidad: Severidad = a.tipo === 'Stock Crítico' ? 'critico' : 'minimo';
    const porcentaje = a.stockMinimo > 0
      ? Math.round((a.stockActual / a.stockMinimo) * 100)
      : 0;
    const brecha = Math.max(0, a.stockMinimo - a.stockActual);
    return { ...a, severidad, porcentaje, brecha };
  }

  setFiltro(f: Filtro): void { this.filtro.set(f); }

  abrirReponer(a: AlertaVista): void {
    this.formReponer = { cantidad: a.brecha > 0 ? a.brecha : 1, observaciones: '' };
    this.reponerItem.set(a);
  }

  cerrarModal(): void { this.reponerItem.set(null); }

  confirmarReponer(): void {
    const item = this.reponerItem();
    if (!item || this.formReponer.cantidad < 1) return;
    this.reponerMut.mutate({
      productoId:    item.productoId,
      cantidad:      this.formReponer.cantidad,
      observaciones: this.formReponer.observaciones
    });
  }

  limpiarNuevas(): void { this.wsNuevas.set(0); }

  refrescar(): void {
    this.qc.invalidateQueries({ queryKey: ['alertas-activas'] });
    this.limpiarNuevas();
  }

  badgeLabel(s: Severidad): string {
    return s === 'critico' ? 'Stock Crítico' : 'Stock Mínimo';
  }

  barColor(s: Severidad): string {
    return s === 'critico' ? '#ef4444' : '#eab308';
  }

  formatFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  private mostrarToast(msg: string, ok: boolean): void {
    this.toastMsg.set(msg);
    this.toastOk.set(ok);
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 3500);
  }
}
