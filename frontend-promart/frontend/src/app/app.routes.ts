import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login').then(m => m.Login)
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/pages/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'productos',
        loadComponent: () => import('./features/productos/pages/lista-productos/lista-productos').then(m => m.ListaProductos)
      },
      {
        path: 'movimientos',
        loadComponent: () => import('./features/movimientos/pages/lista-movimientos/lista-movimientos').then(m => m.ListaMovimientos)
      },
      {
        path: 'reportes',
        loadComponent: () => import('./features/reportes/pages/reportes/reportes').then(m => m.Reportes)
      },
      {
        path: 'trabajadores',
        loadComponent: () => import('./features/trabajadores/pages/lista-trabajadores/lista-trabajadores').then(m => m.ListaTrabajadores)
      },
      {
        path: 'proveedores',
        loadComponent: () => import('./features/proveedores/pages/lista-proveedores/lista-proveedores').then(m => m.ListaProveedores)
      },
      {
        path: 'ordenes',
        loadComponent: () => import('./features/ordenes/pages/lista-ordenes/lista-ordenes').then(m => m.ListaOrdenes)
      },
      {
        path: 'ordenes/nueva',
        loadComponent: () => import('./features/ordenes/pages/generar-orden/generar-orden').then(m => m.GenerarOrden)
      },
      {
        path: 'ordenes/mis-ordenes',
        loadComponent: () => import('./features/ordenes/pages/mis-ordenes/mis-ordenes').then(m => m.MisOrdenes)
      },
      {
        path: 'alertas',
        loadComponent: () => import('./features/alertas/pages/alertas/alertas').then(m => m.Alertas)
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
