import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ProveedorDto, ProveedorRequestDto } from '../models/proveedor.model';

interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class ProveedorService {
  private url = `${environment.apiUrl}/api/proveedores`;

  constructor(private http: HttpClient) {}

  listar(): Observable<ProveedorDto[]> {
    return this.http.get<ApiResponse<ProveedorDto[]>>(this.url)
      .pipe(map(r => r.data));
  }

  registrar(data: ProveedorRequestDto): Observable<ProveedorDto> {
    return this.http.post<ApiResponse<ProveedorDto>>(this.url, data)
      .pipe(map(r => r.data));
  }

  editar(id: number, data: ProveedorRequestDto): Observable<ProveedorDto> {
    return this.http.put<ApiResponse<ProveedorDto>>(`${this.url}/${id}`, data)
      .pipe(map(r => r.data));
  }

  cambiarEstado(id: number, estado: string): Observable<ProveedorDto> {
    return this.http.patch<ApiResponse<ProveedorDto>>(`${this.url}/${id}/estado`, { estado })
      .pipe(map(r => r.data));
  }
}
