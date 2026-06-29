import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, timeout } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ProductoDto, ProductoRequestDto, ApiResponse } from '../models/producto.model';

@Injectable({ providedIn: 'root' })
export class ProductoService {

  private url = `${environment.apiUrl}/api/productos`;
  private readonly TIMEOUT_MS = 8000;

  constructor(private http: HttpClient) {}

  listarProductos(): Observable<ProductoDto[]> {
    return this.http.get<ApiResponse<ProductoDto[]>>(this.url)
      .pipe(timeout(this.TIMEOUT_MS), map(r => r.data));
  }

  buscarPorId(id: number): Observable<ProductoDto> {
    return this.http.get<ApiResponse<ProductoDto>>(`${this.url}/${id}`)
      .pipe(timeout(this.TIMEOUT_MS), map(r => r.data));
  }

  listarBajoStock(): Observable<ProductoDto[]> {
    return this.http.get<ApiResponse<ProductoDto[]>>(`${this.url}/bajo-stock`)
      .pipe(timeout(this.TIMEOUT_MS), map(r => r.data));
  }

  registrar(request: ProductoRequestDto): Observable<ProductoDto> {
    return this.http.post<ApiResponse<ProductoDto>>(this.url, request)
      .pipe(timeout(this.TIMEOUT_MS), map(r => r.data));
  }

  editar(id: number, request: ProductoRequestDto): Observable<ProductoDto> {
    return this.http.put<ApiResponse<ProductoDto>>(`${this.url}/${id}`, request)
      .pipe(timeout(this.TIMEOUT_MS), map(r => r.data));
  }

  cambiarEstado(id: number, estado: 'Activo' | 'Inactivo'): Observable<ProductoDto> {
    return this.http.patch<ApiResponse<ProductoDto>>(`${this.url}/${id}/estado`, { estado })
      .pipe(timeout(this.TIMEOUT_MS), map(r => r.data));
  }

  actualizarStockMinimo(id: number, stockMinimo: number): Observable<ProductoDto> {
    return this.http.patch<ApiResponse<ProductoDto>>(`${this.url}/${id}/stock-minimo`, { stockMinimo })
      .pipe(timeout(this.TIMEOUT_MS), map(r => r.data));
  }
}
