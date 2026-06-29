import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, timeout } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { TrabajadorDto, TrabajadorRequestDto } from '../models/trabajador.model';

interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class TrabajadorService {

  private url = `${environment.apiUrl}/api/trabajadores`;
  private readonly TIMEOUT = 8000;

  constructor(private http: HttpClient) {}

  listar(): Observable<TrabajadorDto[]> {
    return this.http.get<ApiResponse<TrabajadorDto[]>>(this.url)
      .pipe(timeout(this.TIMEOUT), map(r => r.data));
  }

  registrar(req: TrabajadorRequestDto): Observable<TrabajadorDto> {
    return this.http.post<ApiResponse<TrabajadorDto>>(this.url, req)
      .pipe(timeout(this.TIMEOUT), map(r => r.data));
  }

  editar(id: number, req: TrabajadorRequestDto): Observable<TrabajadorDto> {
    return this.http.put<ApiResponse<TrabajadorDto>>(`${this.url}/${id}`, req)
      .pipe(timeout(this.TIMEOUT), map(r => r.data));
  }

  cambiarEstado(id: number, estado: 'Activo' | 'Inactivo'): Observable<TrabajadorDto> {
    return this.http.patch<ApiResponse<TrabajadorDto>>(`${this.url}/${id}/estado`, { estado })
      .pipe(timeout(this.TIMEOUT), map(r => r.data));
  }
}
