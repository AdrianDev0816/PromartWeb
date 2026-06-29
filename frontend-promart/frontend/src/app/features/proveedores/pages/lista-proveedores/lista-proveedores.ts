import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ProveedorService } from '../../services/proveedor.service';
import { ProveedorDto, ProveedorRequestDto } from '../../models/proveedor.model';
import { OrdenCompraService } from '../../../ordenes/services/orden-compra.service';
import { OrdenCompraDto } from '../../../ordenes/models/orden-compra.model';

@Component({
  selector: 'app-lista-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-proveedores.html',
  styleUrl: './lista-proveedores.css'
})
export class ListaProveedores {
  private proveedorService   = inject(ProveedorService);
  private ordenCompraService = inject(OrdenCompraService);
  private queryClient        = inject(QueryClient);

  searchTerm    = signal('');
  estadoFiltro  = signal('');
  currentPage   = signal(1);
  readonly itemsPerPage = 8;

  showModal       = signal(false);
  showPanel       = signal(false);
  editando        = signal(false);
  proveedorSeleccionado = signal<ProveedorDto | null>(null);
  toast = signal({ visible: false, mensaje: '', tipo: 'success' as 'success' | 'error' });

  form = signal<ProveedorRequestDto>({
    nombre: '', ruc: '', contacto: '',
    telefono: '', correo: '', direccion: '', estado: 'Activo'
  });

  proveedoresQuery = injectQuery(() => ({
    queryKey: ['proveedores'],
    queryFn: () => firstValueFrom(this.proveedorService.listar()),
  }));

  ordenesQuery = injectQuery(() => ({
    queryKey: ['ordenes-proveedor-panel'],
    queryFn: () => firstValueFrom(this.ordenCompraService.listar()),
    enabled: this.showPanel(),
    staleTime: 30_000,
  }));

  ordenesProveedor = computed<OrdenCompraDto[]>(() => {
    const prov = this.proveedorSeleccionado();
    if (!prov) return [];
    return (this.ordenesQuery.data() ?? [])
      .filter(o => o.proveedorId === prov.id)
      .sort((a, b) => b.id - a.id);
  });

  totalOrdenesProveedor = computed(() => this.ordenesProveedor().length);
  montoTotalProveedor   = computed(() =>
    this.ordenesProveedor().reduce((s, o) => s + o.total, 0)
  );
  ordenesCompletadas    = computed(() =>
    this.ordenesProveedor().filter(o => o.estado === 'Completada').length
  );
  ordenesPendientes     = computed(() =>
    this.ordenesProveedor().filter(o => o.estado === 'Pendiente').length
  );

  proveedoresFiltrados = computed(() => {
    const lista = this.proveedoresQuery.data() ?? [];
    const term  = this.searchTerm().toLowerCase();
    const est   = this.estadoFiltro();
    return lista.filter(p =>
      (!term || p.nombre.toLowerCase().includes(term) || (p.ruc ?? '').includes(term)) &&
      (!est  || p.estado === est)
    );
  });

  totalPages     = computed(() => Math.ceil(this.proveedoresFiltrados().length / this.itemsPerPage) || 1);
  proveedoresPag = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return this.proveedoresFiltrados().slice(start, start + this.itemsPerPage);
  });
  paginacionHasta = computed(() =>
    Math.min(this.currentPage() * this.itemsPerPage, this.proveedoresFiltrados().length)
  );

  totalActivos = computed(() => (this.proveedoresQuery.data() ?? []).filter(p => p.estado === 'Activo').length);
  totalProductos = computed(() => (this.proveedoresQuery.data() ?? []).reduce((s, p) => s + (p.cantidadProductos ?? 0), 0));

  guardarMutation = injectMutation(() => ({
    mutationFn: ({ form, id }: { form: ProveedorRequestDto; id?: number }) =>
      id ? firstValueFrom(this.proveedorService.editar(id, form))
         : firstValueFrom(this.proveedorService.registrar(form)),
    onSuccess: (_, vars) => {
      this.queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      this.cerrarModal();
      this.mostrarToast(vars.id ? 'Proveedor actualizado' : 'Proveedor registrado', 'success');
    },
    onError: (err: any) => this.mostrarToast(err?.error?.message || 'Error al guardar', 'error')
  }));

  estadoMutation = injectMutation(() => ({
    mutationFn: ({ id, estado }: { id: number; estado: string }) =>
      firstValueFrom(this.proveedorService.cambiarEstado(id, estado)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      this.mostrarToast('Estado actualizado', 'success');
    },
    onError: () => this.mostrarToast('Error al cambiar estado', 'error')
  }));

  abrirModalNuevo() {
    this.editando.set(false);
    this.proveedorSeleccionado.set(null);
    this.form.set({ nombre: '', ruc: '', contacto: '', telefono: '', correo: '', direccion: '', estado: 'Activo' });
    this.showModal.set(true);
  }

  abrirModalEditar(p: ProveedorDto) {
    this.editando.set(true);
    this.proveedorSeleccionado.set(p);
    this.form.set({ nombre: p.nombre, ruc: p.ruc ?? '', contacto: p.contacto ?? '',
      telefono: p.telefono ?? '', correo: p.correo ?? '', direccion: p.direccion ?? '', estado: p.estado });
    this.showModal.set(true);
  }

  cerrarModal() { this.showModal.set(false); }

  guardar() {
    const f = this.form();
    if (!f.nombre?.trim()) { this.mostrarToast('La razón social es requerida', 'error'); return; }
    const id = this.proveedorSeleccionado()?.id;
    this.guardarMutation.mutate({ form: f, id });
  }

  toggleEstado(p: ProveedorDto) {
    const nuevoEstado = p.estado === 'Activo' ? 'Inactivo' : 'Activo';
    this.estadoMutation.mutate({ id: p.id, estado: nuevoEstado });
  }

  abrirPanel(p: ProveedorDto) {
    this.proveedorSeleccionado.set(p);
    this.showPanel.set(true);
  }
  cerrarPanel() { this.showPanel.set(false); }

  filtrar() { this.currentPage.set(1); }
  limpiar()  { this.searchTerm.set(''); this.estadoFiltro.set(''); this.currentPage.set(1); }
  prevPage() { if (this.currentPage() > 1) this.currentPage.update(p => p - 1); }
  nextPage() { if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1); }

  updateForm(field: keyof ProveedorRequestDto, value: string) {
    this.form.update(f => ({ ...f, [field]: value }));
  }

  mostrarToast(mensaje: string, tipo: 'success' | 'error') {
    this.toast.set({ visible: true, mensaje, tipo });
    setTimeout(() => this.toast.update(t => ({ ...t, visible: false })), 3000);
  }

  // ── Helpers panel órdenes ─────────────────────────────────────────────────
  formatFecha(iso: string | null): string {
    if (!iso) return '—';
    const d = iso.substring(0, 10);
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  }

  formatMonto(n: number): string {
    return 'S/ ' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  badgeOrden(estado: string): string {
    const map: Record<string, string> = {
      Pendiente:  'ord-pendiente',
      Aprobada:   'ord-aprobada',
      Rechazada:  'ord-rechazada',
      EnProceso:  'ord-aprobada',
      Completada: 'ord-completada',
      Cancelada:  'ord-cancelada',
    };
    return map[estado] ?? 'ord-cancelada';
  }

  etiquetaEstado(estado: string): string {
    return estado === 'EnProceso' ? 'En proceso' : estado;
  }
}
