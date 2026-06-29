export interface OrdenCompraDetalleDto {
  id:                 number;
  productoId:         number;
  productoNombre:     string;
  productoCodigoSerie:string;
  cantidad:           number;
  precioUnitario:     number;
  subtotal:           number;
}

export interface OrdenCompraDto {
  id:                  number;
  numeroOrden:         string;
  proveedorId:         number;
  proveedorNombre:     string;
  fechaEmision:        string;
  fechaEstimadaEntrega:string | null;
  estado:              'Pendiente' | 'Aprobada' | 'Rechazada' | 'EnProceso' | 'Completada' | 'Cancelada';
  observaciones:       string | null;
  total:               number;
  cantidadProductos:   number;
  trabajadorId:        number;
  trabajadorNombre:    string;
  trabajadorCargo:     string;
  evaluadorId:         number | null;
  evaluadorNombre:     string | null;
  fechaEvaluacion:     string | null;
  motivoRechazo:       string | null;
  fechaCompletado:     string | null;
  detalles:            OrdenCompraDetalleDto[];
}

export interface OrdenCompraDetalleRequest {
  idProducto:    number;
  cantidad:      number;
  precioUnitario:number;
}

export interface OrdenCompraRequest {
  idProveedor:          number;
  fechaEstimadaEntrega: string | null;
  observaciones:        string;
  detalles:             OrdenCompraDetalleRequest[];
}

export interface EvaluacionRequest {
  comentario: string;
}
