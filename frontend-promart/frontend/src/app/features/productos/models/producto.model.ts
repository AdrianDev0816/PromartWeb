export interface ProductoDto {
  id: number;
  codigoSerie: string;
  nombre: string;
  categoria: string;
  stockActual: number;
  stockMinimo: number;
  precio: number;
  estado: string;
  proveedor: string | null;
  proveedorId: number | null;
}

export interface ProductoRequestDto {
  codigoSerie: string;
  nombre: string;
  categoria: string;
  stockMinimo: number;
  precio: number;
  idProveedor?: number | null;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
}