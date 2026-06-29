import { Injectable, inject, OnDestroy } from '@angular/core';
import { RxStomp } from '@stomp/rx-stomp';
import { IMessage } from '@stomp/stompjs';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { environment } from '../../../environments/environment';
import { NotificacionWs } from '../models/notificacion.model';

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {

  private rxStomp    = new RxStomp();
  private queryClient = inject(QueryClient);
  private subs        = new Subscription();

  connect(): void {
    if (this.rxStomp.active) return;

    const wsUrl = environment.apiUrl.replace(/^http/, 'ws') + '/ws';

    this.rxStomp.configure({
      brokerURL:      wsUrl,
      reconnectDelay: 5000,
    });
    this.rxStomp.activate();

    // Auto-invalida caché de productos y movimientos ante cualquier cambio
    this.subs.add(
      this.rxStomp.watch('/topic/dashboard').subscribe((_msg: IMessage) => {
        this.queryClient.invalidateQueries({ queryKey: ['productos'] });
        this.queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      })
    );
  }

  disconnect(): void {
    this.subs.unsubscribe();
    this.rxStomp.deactivate();
  }

  notificaciones$(): Observable<NotificacionWs> {
    return this.rxStomp.watch('/topic/notificaciones').pipe(
      map((msg: IMessage) => JSON.parse(msg.body) as NotificacionWs)
    );
  }

  alertas$(): Observable<NotificacionWs> {
    return this.rxStomp.watch('/topic/alertas').pipe(
      map((msg: IMessage) => JSON.parse(msg.body) as NotificacionWs)
    );
  }

  ordenes$(): Observable<NotificacionWs> {
    return this.rxStomp.watch('/topic/ordenes').pipe(
      map((msg: IMessage) => JSON.parse(msg.body) as NotificacionWs)
    );
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
