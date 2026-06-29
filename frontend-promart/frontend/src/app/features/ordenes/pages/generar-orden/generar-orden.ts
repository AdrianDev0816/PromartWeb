import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { OrdenCompraService } from '../../services/orden-compra.service';
import { ProveedorService } from '../../../proveedores/services/proveedor.service';
import { ProductoService } from '../../../productos/services/producto.service';
import { OrdenCompraDetalleRequest } from '../../models/orden-compra.model';

interface FilaDetalle {
  idProducto:    number | null;
  nombreProducto:string;
  cantidad:      number;
  precioUnitario:number;
}

@Component({
  selector: 'app-generar-orden',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './generar-orden.html',
  styleUrl: './generar-orden.css'
})
export class GenerarOrden {

  private svc         = inject(OrdenCompraService);
  private provSvc     = inject(ProveedorService);
  private prodSvc     = inject(ProductoService);
  private router      = inject(Router);
  private queryClient = inject(QueryClient);

  // ── Queries de referencia ─────────────────────────────────────────────────
  queryProveedores = injectQuery(() => ({
    queryKey: ['proveedores'],
    queryFn:  () => firstValueFrom(this.provSvc.listar()),
  }));

  queryProductos = injectQuery(() => ({
    queryKey: ['productos'],
    queryFn:  () => firstValueFrom(this.prodSvc.listarProductos()),
  }));

  // ── Formulario principal ──────────────────────────────────────────────────
  idProveedor          = signal<number | null>(null);
  fechaEstimadaEntrega = signal('');
  observaciones        = signal('');

  // ── Tabla de detalles ─────────────────────────────────────────────────────
  filas = signal<FilaDetalle[]>([
    { idProducto: null, nombreProducto: '', cantidad: 1, precioUnitario: 0 }
  ]);

  total = computed(() =>
    this.filas().reduce((acc, f) => acc + f.cantidad * f.precioUnitario, 0)
  );

  // ── Errores y estado ──────────────────────────────────────────────────────
  error   = signal('');
  toastOk = signal(false);

  // ── Mutation ──────────────────────────────────────────────────────────────
  mutation = injectMutation(() => ({
    mutationFn: (req: Parameters<typeof this.svc.crear>[0]) =>
      firstValueFrom(this.svc.crear(req)),
    onSuccess: (data) => {
      this.queryClient.invalidateQueries({ queryKey: ['ordenes'] });
      this.toastOk.set(true);
      setTimeout(() => this.router.navigate(['/ordenes']), 1800);
    },
    onError: (e: any) =>
      this.error.set(e?.error?.message ?? 'Error al crear la orden')
  }));

  // ── Acciones de filas ─────────────────────────────────────────────────────
  agregarFila(): void {
    this.filas.update(f => [
      ...f,
      { idProducto: null, nombreProducto: '', cantidad: 1, precioUnitario: 0 }
    ]);
  }

  quitarFila(idx: number): void {
    this.filas.update(f => f.filter((_, i) => i !== idx));
  }

  onProductoChange(idx: number, idStr: string): void {
    const id = Number(idStr);
    const prod = this.queryProductos.data()?.find(p => p.id === id);
    this.filas.update(f =>
      f.map((fila, i) => i === idx
        ? { ...fila, idProducto: id, nombreProducto: prod?.nombre ?? '', precioUnitario: prod?.precio ?? 0 }
        : fila
      )
    );
  }

  onCantidadChange(idx: number, val: string): void {
    const cant = Math.max(1, Number(val) || 1);
    this.filas.update(f => f.map((fila, i) => i === idx ? { ...fila, cantidad: cant } : fila));
  }

  onPrecioChange(idx: number, val: string): void {
    const precio = Math.max(0, Number(val) || 0);
    this.filas.update(f => f.map((fila, i) => i === idx ? { ...fila, precioUnitario: precio } : fila));
  }

  // ── Enviar ────────────────────────────────────────────────────────────────
  enviar(): void {
    this.error.set('');

    if (!this.idProveedor()) {
      this.error.set('Selecciona un proveedor');
      return;
    }
    const detallesValidos = this.filas().filter(f => f.idProducto && f.cantidad > 0 && f.precioUnitario > 0);
    if (detallesValidos.length === 0) {
      this.error.set('Agrega al menos un producto con cantidad y precio válidos');
      return;
    }
    const detalles: OrdenCompraDetalleRequest[] = detallesValidos.map(f => ({
      idProducto:     f.idProducto!,
      cantidad:       f.cantidad,
      precioUnitario: f.precioUnitario,
    }));

    this.mutation.mutate({
      idProveedor:          this.idProveedor()!,
      fechaEstimadaEntrega: this.fechaEstimadaEntrega() || null,
      observaciones:        this.observaciones(),
      detalles,
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  formatMonto(n: number): string {
    return 'S/ ' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  subtotal(f: FilaDetalle): number { return f.cantidad * f.precioUnitario; }

  trackByIdx(_: number, item: any): number { return _; }
}
