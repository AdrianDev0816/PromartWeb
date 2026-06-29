export interface AlertaDto {
  id: number;
  productoId: number;
  productoNombre: string;
  productoCategoria: string;
  productoCodigo: string;
  tipo: string;
  stockActual: number;
  stockMinimo: number;
  leida: boolean;
  resuelta: boolean;
  fecha: string;
  trabajadorId: number | null;
  trabajadorNombre: string | null;
  fechaResolucion: string | null;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
}
