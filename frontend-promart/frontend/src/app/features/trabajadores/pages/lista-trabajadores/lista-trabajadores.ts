import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QueryClient, injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { TrabajadorService } from '../../services/trabajador.service';
import { TrabajadorDto, TrabajadorRequestDto } from '../../models/trabajador.model';

@Component({
  selector: 'app-lista-trabajadores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-trabajadores.html',
  styleUrl: './lista-trabajadores.css'
})
export class ListaTrabajadores {

  private service     = inject(TrabajadorService);
  private queryClient = inject(QueryClient);

  Math = Math;

  // ─── Filtros ──────────────────────────────────────────
  searchTerm   = signal('');
  filtroRol    = signal('');
  filtroEstado = signal('');
  currentPage  = signal(1);
  readonly itemsPerPage = 8;

  // ─── Modal ────────────────────────────────────────────
  showModal            = signal(false);
  editando             = signal(false);
  trabajadorSeleccionado = signal<TrabajadorDto | null>(null);
  form: TrabajadorRequestDto = this.formVacio();

  // ─── Toast ────────────────────────────────────────────
  toast = signal({ visible: false, mensaje: '', tipo: 'success' as 'success' | 'error' });
  private toastTimer: any;

  readonly cargos = ['Administrador', 'Supervisor', 'Almacenero'];
  readonly avatarColors = ['#C8102E', '#378ADD', '#7F77DD', '#1D9E75', '#BA7517', '#D4537E', '#639922', '#0e7490'];

  // ─── Query ────────────────────────────────────────────
  trabajadoresQuery = injectQuery(() => ({
    queryKey: ['trabajadores'],
    queryFn:  () => firstValueFrom(this.service.listar()),
  }));

  // ─── Computed ─────────────────────────────────────────
  trabajadoresFiltrados = computed(() => {
    const all  = this.trabajadoresQuery.data() ?? [];
    const term = this.searchTerm().toLowerCase().trim();
    const rol  = this.filtroRol();
    const est  = this.filtroEstado();
    return all.filter(t => {
      if (term && !t.nombre.toLowerCase().includes(term) &&
                  !t.usuario.toLowerCase().includes(term) &&
                  !t.email.toLowerCase().includes(term)) return false;
      if (rol && t.cargo !== rol)   return false;
      if (est && t.estado !== est)  return false;
      return true;
    });
  });

  totalPages = computed(() =>
    Math.ceil(this.trabajadoresFiltrados().length / this.itemsPerPage) || 1
  );

  trabajadoresPaginados = computed(() => {
    const s = (this.currentPage() - 1) * this.itemsPerPage;
    return this.trabajadoresFiltrados().slice(s, s + this.itemsPerPage);
  });

  totalActivos = computed(() =>
    (this.trabajadoresQuery.data() ?? []).filter(t => t.estado === 'Activo').length
  );

  rolesUnicos = computed(() =>
    new Set((this.trabajadoresQuery.data() ?? []).map(t => t.cargo)).size
  );

  // ─── Mutations ────────────────────────────────────────
  guardarMutation = injectMutation(() => ({
    mutationFn: ({ form, id }: { form: TrabajadorRequestDto; id?: number }) =>
      id ? firstValueFrom(this.service.editar(id, form))
         : firstValueFrom(this.service.registrar(form)),
    onSuccess: (_, vars) => {
      this.queryClient.invalidateQueries({ queryKey: ['trabajadores'] });
      this.cerrarModal();
      this.mostrarToast(vars.id ? 'Trabajador actualizado correctamente' : 'Trabajador registrado correctamente', 'success');
    },
    onError: (err: any) => {
      this.mostrarToast(err?.error?.message || 'Error al guardar el trabajador.', 'error');
    }
  }));

  estadoMutation = injectMutation(() => ({
    mutationFn: ({ id, estado }: { id: number; estado: 'Activo' | 'Inactivo' }) =>
      firstValueFrom(this.service.cambiarEstado(id, estado)),
    onSuccess: (_, { estado }) => {
      this.queryClient.invalidateQueries({ queryKey: ['trabajadores'] });
      this.mostrarToast(`Trabajador ${estado.toLowerCase()} correctamente`, 'success');
    },
    onError: () => this.mostrarToast('Error al cambiar el estado.', 'error')
  }));

  // ─── Acciones ─────────────────────────────────────────
  prevPage(): void { if (this.currentPage() > 1) this.currentPage.update(p => p - 1); }
  nextPage(): void { if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1); }

  abrirModalNuevo(): void {
    this.editando.set(false);
    this.trabajadorSeleccionado.set(null);
    this.form = this.formVacio();
    this.showModal.set(true);
  }

  abrirModalEditar(t: TrabajadorDto): void {
    this.editando.set(true);
    this.trabajadorSeleccionado.set(t);
    this.form = { nombre: t.nombre, cargo: t.cargo, usuario: t.usuario, clave: '', estado: t.estado };
    this.showModal.set(true);
  }

  cerrarModal(): void {
    this.showModal.set(false);
    this.trabajadorSeleccionado.set(null);
  }

  guardar(): void {
    if (!this.form.nombre || !this.form.cargo || !this.form.usuario) return;
    if (!this.editando() && !this.form.clave) return;
    this.guardarMutation.mutate({ form: this.form, id: this.trabajadorSeleccionado()?.id });
  }

  toggleEstado(t: TrabajadorDto): void {
    const estado = t.estado === 'Activo' ? 'Inactivo' : 'Activo';
    this.estadoMutation.mutate({ id: t.id, estado });
  }

  // ─── Helpers ──────────────────────────────────────────
  getAvatarColor(iniciales: string): string {
    let hash = 0;
    for (let i = 0; i < iniciales.length; i++) hash += iniciales.charCodeAt(i);
    return this.avatarColors[hash % this.avatarColors.length];
  }

  mostrarToast(mensaje: string, tipo: 'success' | 'error'): void {
    clearTimeout(this.toastTimer);
    this.toast.set({ visible: true, mensaje, tipo });
    this.toastTimer = setTimeout(() => this.toast.update(t => ({ ...t, visible: false })), 3500);
  }

  private formVacio(): TrabajadorRequestDto {
    return { nombre: '', cargo: 'Almacenero', usuario: '', clave: '', estado: 'Activo' };
  }
}
