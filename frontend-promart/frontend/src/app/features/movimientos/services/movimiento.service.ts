import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, timeout } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { MovimientoRequestDto, MovimientoResponseDto, ReporteMovimientoDto } from '../models/movimiento.model';

interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class MovimientoService {

  private url = `${environment.apiUrl}/api/movimientos`;
  private readonly TIMEOUT = 8000;

  constructor(private http: HttpClient) {}

  listarMovimientos(): Observable<MovimientoResponseDto[]> {
    return this.http.get<ApiResponse<MovimientoResponseDto[]>>(this.url)
      .pipe(timeout(this.TIMEOUT), map(r => r.data));
  }

  registrarEntrada(request: MovimientoRequestDto): Observable<MovimientoResponseDto> {
    return this.http.post<ApiResponse<MovimientoResponseDto>>(`${this.url}/entrada`, request)
      .pipe(timeout(this.TIMEOUT), map(r => r.data));
  }

  registrarSalida(request: MovimientoRequestDto): Observable<MovimientoResponseDto> {
    return this.http.post<ApiResponse<MovimientoResponseDto>>(`${this.url}/salida`, request)
      .pipe(timeout(this.TIMEOUT), map(r => r.data));
  }

  obtenerReporte(motivo?: string, desde?: string, hasta?: string): Observable<ReporteMovimientoDto> {
    let params = new HttpParams();
    if (motivo) params = params.set('motivo', motivo);
    if (desde)  params = params.set('desde', desde);
    if (hasta)  params = params.set('hasta', hasta);
    return this.http.get<ApiResponse<ReporteMovimientoDto>>(`${this.url}/reporte`, { params })
      .pipe(timeout(this.TIMEOUT), map(r => r.data));
  }
}
