import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, timeout } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { OrdenCompraDto, OrdenCompraRequest, EvaluacionRequest } from '../models/orden-compra.model';

interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class OrdenCompraService {

  private url = `${environment.apiUrl}/api/ordenes`;
  private TO   = 10000;

  constructor(private http: HttpClient) {}

  listar(): Observable<OrdenCompraDto[]> {
    return this.http.get<ApiResponse<OrdenCompraDto[]>>(this.url)
      .pipe(timeout(this.TO), map(r => r.data));
  }

  listarMisOrdenes(): Observable<OrdenCompraDto[]> {
    return this.http.get<ApiResponse<OrdenCompraDto[]>>(`${this.url}/mis-ordenes`)
      .pipe(timeout(this.TO), map(r => r.data));
  }

  obtener(id: number): Observable<OrdenCompraDto> {
    return this.http.get<ApiResponse<OrdenCompraDto>>(`${this.url}/${id}`)
      .pipe(timeout(this.TO), map(r => r.data));
  }

  crear(req: OrdenCompraRequest): Observable<OrdenCompraDto> {
    return this.http.post<ApiResponse<OrdenCompraDto>>(this.url, req)
      .pipe(timeout(this.TO), map(r => r.data));
  }

  aprobar(id: number, body: EvaluacionRequest): Observable<OrdenCompraDto> {
    return this.http.patch<ApiResponse<OrdenCompraDto>>(`${this.url}/${id}/aprobar`, body)
      .pipe(timeout(this.TO), map(r => r.data));
  }

  rechazar(id: number, body: EvaluacionRequest): Observable<OrdenCompraDto> {
    return this.http.patch<ApiResponse<OrdenCompraDto>>(`${this.url}/${id}/rechazar`, body)
      .pipe(timeout(this.TO), map(r => r.data));
  }

  completar(id: number): Observable<OrdenCompraDto> {
    return this.http.patch<ApiResponse<OrdenCompraDto>>(`${this.url}/${id}/completar`, {})
      .pipe(timeout(this.TO), map(r => r.data));
  }

  cancelar(id: number): Observable<OrdenCompraDto> {
    return this.http.patch<ApiResponse<OrdenCompraDto>>(`${this.url}/${id}/cancelar`, {})
      .pipe(timeout(this.TO), map(r => r.data));
  }
}
