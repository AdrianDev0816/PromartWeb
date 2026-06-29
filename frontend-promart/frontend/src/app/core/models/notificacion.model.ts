export interface NotificacionWs {
  tipo:     'MOVIMIENTO' | 'STOCK_BAJO' | 'PRODUCTO' | 'ORDEN';
  nivel:    'INFO' | 'WARNING';
  mensaje:  string;
  data?:    any;
  timestamp: string;
}

export interface ToastWs extends NotificacionWs {
  id: number;
}
