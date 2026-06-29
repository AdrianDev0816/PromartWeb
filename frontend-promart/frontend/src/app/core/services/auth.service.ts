import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LoginRequestDto, LoginResponseDto } from '../../features/trabajadores/models/trabajador.model';

interface ApiResponse<T> { success: boolean; message: string; data: T; }

const SESSION_KEY = 'promart_session';
const TOKEN_KEY   = 'promart_token';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private url = `${environment.apiUrl}/api/auth`;

  constructor(private http: HttpClient, private router: Router) {}

  login(request: LoginRequestDto): Observable<LoginResponseDto> {
    return this.http.post<ApiResponse<LoginResponseDto>>(`${this.url}/login`, request).pipe(
      map(r => r.data),
      tap(user => {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        localStorage.setItem(TOKEN_KEY, user.token);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getCurrentUser(): LoginResponseDto | null {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  getCargo(): string {
    return this.getCurrentUser()?.cargo ?? '';
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  tieneAcceso(roles: string[]): boolean {
    const cargo = this.getCargo();
    return roles.includes(cargo);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }
}
