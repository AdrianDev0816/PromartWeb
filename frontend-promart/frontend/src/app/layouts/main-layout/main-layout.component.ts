import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { NotificacionWs, ToastWs } from '../../core/models/notificacion.model';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent implements OnInit, OnDestroy {

  alertasCount   = 0;
  noLeidas       = 0;
  isDark         = false;
  isSidebarOpen  = false;
  panelAbierto   = false;
  ordenesExpanded = false;
  notificaciones: NotificacionWs[] = [];
  toasts:         ToastWs[]        = [];

  usuario = { nombre: '', cargo: '', iniciales: '' };

  private subs = new Subscription();
  private toastId = 0;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService:    AuthService,
    private wsService:      WebSocketService
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('theme') || 'light';
      this.isDark = saved === 'dark';
      document.body.className = saved;

      const user = this.authService.getCurrentUser();
      if (user) {
        this.usuario = {
          nombre:    user.nombre,
          cargo:     user.cargo,
          iniciales: user.iniciales
        };
      }

      this.wsService.connect();

      this.subs.add(
        this.wsService.notificaciones$().subscribe(n => this.agregarNotificacion(n))
      );
      this.subs.add(
        this.wsService.alertas$().subscribe(n => {
          this.alertasCount++;
          this.agregarNotificacion(n);
        })
      );
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.wsService.disconnect();
  }

  private agregarNotificacion(n: NotificacionWs): void {
    this.notificaciones = [n, ...this.notificaciones].slice(0, 20);
    this.noLeidas++;
    this.mostrarToast(n);
  }

  private mostrarToast(n: NotificacionWs): void {
    const t: ToastWs = { ...n, id: ++this.toastId };
    this.toasts = [...this.toasts, t];
    setTimeout(() => this.cerrarToast(t.id), 5000);
  }

  cerrarToast(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  togglePanel(): void {
    this.panelAbierto = !this.panelAbierto;
    if (this.panelAbierto) this.noLeidas = 0;
  }

  tieneAcceso(roles: string[]): boolean {
    return this.authService.tieneAcceso(roles);
  }

  logout(): void { this.authService.logout(); }

  toggleTheme(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isDark = !this.isDark;
      const theme = this.isDark ? 'dark' : 'light';
      document.body.className = theme;
      localStorage.setItem('theme', theme);
    }
  }

  toggleSidebar(): void { this.isSidebarOpen = !this.isSidebarOpen; }
  closeSidebar():  void { this.isSidebarOpen = false; }
}
