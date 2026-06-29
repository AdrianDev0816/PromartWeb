export interface MovimientoResponseDto {
  id: number;
  tipo: string;
  motivo: string | null;
  fecha: string;
  cantidad: number;
  precioUnitario: number;
  precioTotal: number;
  observaciones: string | null;
  trabajador: string | null;
  productoId: number;
  productoNombre: string;
  productoCategoria: string;
  productoCodigoSerie: string;
}

export interface MovimientoRequestDto {
  productoId: number | null;
  cantidad: number;
  trabajadorId: number | null;
  motivo: string;
  observaciones: string;
}

export interface ReporteMovimientoDto {
  movimientos: MovimientoResponseDto[];
  total: number;
  etiquetaTotal: string;
  mostrarTotal: boolean;
}
