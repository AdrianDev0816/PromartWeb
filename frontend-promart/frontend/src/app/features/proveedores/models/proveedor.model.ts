export interface ProveedorDto {
  id: number;
  nombre: string;
  ruc: string;
  contacto: string;
  telefono: string;
  correo: string;
  direccion: string;
  estado: 'Activo' | 'Inactivo';
  cantidadProductos: number;
}

export interface ProveedorRequestDto {
  nombre: string;
  ruc: string;
  contacto: string;
  telefono: string;
  correo: string;
  direccion: string;
  estado?: string;
}
