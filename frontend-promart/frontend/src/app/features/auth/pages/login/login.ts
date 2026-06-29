import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  private authService = inject(AuthService);
  private router      = inject(Router);

  usuario    = '';
  clave      = '';
  loading    = signal(false);
  error      = signal('');
  showClave  = signal(false);

  login(): void {
    if (!this.usuario || !this.clave) {
      this.error.set('Ingresa tu usuario y contraseña.');
      return;
    }
    this.loading.set(true);
    this.error.set('');

    this.authService.login({ usuario: this.usuario, clave: this.clave }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Usuario o contraseña incorrectos.');
      }
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.login();
  }
}
