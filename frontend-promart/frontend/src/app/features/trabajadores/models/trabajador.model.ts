export interface TrabajadorDto {
  id: number;
  nombre: string;
  cargo: 'Supervisor' | 'Almacenero' | 'Administrador' | 'Cajero';
  usuario: string;
  email: string;
  estado: 'Activo' | 'Inactivo';
  rolNombre: string | null;
  iniciales: string;
}

export interface TrabajadorRequestDto {
  nombre: string;
  cargo: string;
  usuario: string;
  clave: string;
  estado: string;
}

export interface LoginRequestDto {
  usuario: string;
  clave: string;
}

export interface LoginResponseDto {
  id: number;
  nombre: string;
  cargo: string;
  usuario: string;
  iniciales: string;
  token: string;
  expiresIn: number;
}
