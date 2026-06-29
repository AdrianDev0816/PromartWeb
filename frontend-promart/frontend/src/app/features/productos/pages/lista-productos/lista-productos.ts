import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QueryClient, injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { ProductoService } from '../../services/producto.service';
import { ProductoDto, ProductoRequestDto } from '../../models/producto.model';
import { ProveedorService } from '../../../proveedores/services/proveedor.service';

@Component({
  selector: 'app-lista-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-productos.html',
  styleUrl: './lista-productos.css'
})
export class ListaProductos {

  private productoService  = inject(ProductoService);
  private proveedorService = inject(ProveedorService);
  private queryClient      = inject(QueryClient);

  Math = Math;
  readonly itemsPerPage = 8;

  // ─── Filtros ──────────────────────────────────────────
  searchTerm      = signal('');
  categoriaFiltro = signal('');
  estadoFiltro    = signal('');
  currentPage     = signal(1);

  // ─── Modal ────────────────────────────────────────────
  showModal            = signal(false);
  editando             = signal(false);
  productoSeleccionado = signal<ProductoDto | null>(null);
  form: ProductoRequestDto = this.formVacio();

  // ─── Toast ────────────────────────────────────────────
  toast = signal({ visible: false, mensaje: '', tipo: 'success' as 'success' | 'error' });
  private toastTimer: any;

  readonly categorias = [
    'Hogar', 'Tecnología', 'Maquillaje', 'Peluches',
    'Accesorios', 'Papelería', 'Bolsos y Mochilas',
    'Belleza y Cuidado', 'Juguetes', 'Snacks y Dulces',
    'Menaje y Cocina', 'Viajes y Deportes', 'Moda y Textil', 'Mascotas'
  ];

  // ─── Queries ──────────────────────────────────────────
  productosQuery = injectQuery(() => ({
    queryKey: ['productos'],
    queryFn:  () => firstValueFrom(this.productoService.listarProductos()),
  }));

  proveedoresQuery = injectQuery(() => ({
    queryKey: ['proveedores'],
    queryFn:  () => firstValueFrom(this.proveedorService.listar()),
  }));

  // ─── Computed ─────────────────────────────────────────
  productosFiltrados = computed(() => {
    const all  = this.productosQuery.data() ?? [];
    const term = this.searchTerm().toLowerCase().trim();
    const cat  = this.categoriaFiltro();
    const est  = this.estadoFiltro();
    return all.filter(p => {
      if (term && !p.nombre.toLowerCase().includes(term) && !p.codigoSerie.toLowerCase().includes(term)) return false;
      if (cat && p.categoria !== cat) return false;
      if (est && p.estado   !== est)  return false;
      return true;
    });
  });

  totalPages = computed(() =>
    Math.ceil(this.productosFiltrados().length / this.itemsPerPage) || 1
  );

  productosPaginados = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return this.productosFiltrados().slice(start, start + this.itemsPerPage);
  });

  // ─── Mutations ────────────────────────────────────────
  guardarMutation = injectMutation(() => ({
    mutationFn: ({ form, id }: { form: ProductoRequestDto; id?: number }) =>
      id ? firstValueFrom(this.productoService.editar(id, form))
         : firstValueFrom(this.productoService.registrar(form)),
    onSuccess: (_, vars) => {
      this.queryClient.invalidateQueries({ queryKey: ['productos'] });
      this.cerrarModal();
      this.mostrarToast(vars.id ? 'Producto actualizado correctamente' : 'Producto registrado correctamente', 'success');
    },
    onError: (err: any) => {
      this.mostrarToast(err?.error?.message || 'Error al guardar el producto.', 'error');
    }
  }));

  cambiarEstadoMutation = injectMutation(() => ({
    mutationFn: ({ id, estado }: { id: number; estado: 'Activo' | 'Inactivo' }) =>
      firstValueFrom(this.productoService.cambiarEstado(id, estado)),
    onSuccess: (_, { estado }) => {
      this.queryClient.invalidateQueries({ queryKey: ['productos'] });
      this.mostrarToast(`Producto ${estado.toLowerCase()} correctamente`, 'success');
    },
    onError: () => this.mostrarToast('Error al cambiar el estado del producto.', 'error')
  }));

  // ─── Acciones ─────────────────────────────────────────
  limpiarFiltros(): void {
    this.searchTerm.set('');
    this.categoriaFiltro.set('');
    this.estadoFiltro.set('');
    this.currentPage.set(1);
  }

  prevPage(): void { if (this.currentPage() > 1) this.currentPage.update(p => p - 1); }
  nextPage(): void { if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1); }

  abrirModalNuevo(): void {
    this.editando.set(false);
    this.productoSeleccionado.set(null);
    this.form = this.formVacio();
    this.showModal.set(true);
  }

  abrirModalEditar(producto: ProductoDto): void {
    this.editando.set(true);
    this.productoSeleccionado.set(producto);
    this.form = {
      codigoSerie: producto.codigoSerie,
      nombre:      producto.nombre,
      categoria:   producto.categoria,
      stockMinimo: producto.stockMinimo,
      precio:      producto.precio,
      idProveedor: producto.proveedorId ?? null
    };
    this.showModal.set(true);
  }

  cerrarModal(): void {
    this.showModal.set(false);
    this.productoSeleccionado.set(null);
  }

  guardarProducto(): void {
    if (!this.form.codigoSerie || !this.form.nombre || !this.form.categoria || !this.form.precio) return;
    this.guardarMutation.mutate({ form: this.form, id: this.productoSeleccionado()?.id });
  }

  toggleEstado(producto: ProductoDto): void {
    const estado = producto.estado === 'Activo' ? 'Inactivo' : 'Activo';
    this.cambiarEstadoMutation.mutate({ id: producto.id, estado });
  }

  esBajoStock(p: ProductoDto): boolean {
    return p.stockActual <= p.stockMinimo;
  }

  mostrarToast(mensaje: string, tipo: 'success' | 'error'): void {
    clearTimeout(this.toastTimer);
    this.toast.set({ visible: true, mensaje, tipo });
    this.toastTimer = setTimeout(() => this.toast.update(t => ({ ...t, visible: false })), 3500);
  }

  private formVacio(): ProductoRequestDto {
    return { codigoSerie: '', nombre: '', categoria: '', stockMinimo: 1, precio: 0, idProveedor: null };
  }
}
