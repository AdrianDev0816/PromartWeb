import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, timeout } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AlertaDto, ApiResponse } from '../models/alerta.model';

@Injectable({ providedIn: 'root' })
export class AlertaService {

  private url = `${environment.apiUrl}/api/alertas`;
  private readonly TIMEOUT_MS = 8000;

  constructor(private http: HttpClient) {}

  listarActivas(): Observable<AlertaDto[]> {
    return this.http.get<ApiResponse<AlertaDto[]>>(`${this.url}/activas`)
      .pipe(timeout(this.TIMEOUT_MS), map(r => r.data));
  }

  listarConFiltros(tipo?: string, leida?: boolean, resuelta?: boolean,
                   desde?: string, hasta?: string): Observable<AlertaDto[]> {
    let params = new HttpParams();
    if (tipo)               params = params.set('tipo', tipo);
    if (leida    != null)   params = params.set('leida',    String(leida));
    if (resuelta != null)   params = params.set('resuelta', String(resuelta));
    if (desde)              params = params.set('desde', desde);
    if (hasta)              params = params.set('hasta', hasta);
    return this.http.get<ApiResponse<AlertaDto[]>>(this.url, { params })
      .pipe(timeout(this.TIMEOUT_MS), map(r => r.data));
  }

  marcarLeida(id: number): Observable<AlertaDto> {
    return this.http.patch<ApiResponse<AlertaDto>>(`${this.url}/${id}/marcar-leida`, {})
      .pipe(timeout(this.TIMEOUT_MS), map(r => r.data));
  }

  resolver(id: number): Observable<AlertaDto> {
    return this.http.patch<ApiResponse<AlertaDto>>(`${this.url}/${id}/resolver`, {})
      .pipe(timeout(this.TIMEOUT_MS), map(r => r.data));
  }

  marcarTodasLeidas(): Observable<void> {
    return this.http.patch<ApiResponse<void>>(`${this.url}/marcar-todas-leidas`, {})
      .pipe(timeout(this.TIMEOUT_MS), map(() => undefined));
  }
}
