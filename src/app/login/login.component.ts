import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  login = '';
  password = '';
  loading = false;
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    if (!this.login.trim() || !this.password.trim()) {
      this.errorMessage = 'Veuillez saisir votre login et votre mot de passe.';
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    this.authService.login(this.login.trim(), this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 401 || err.status === 403) {
          this.errorMessage = 'Login ou mot de passe incorrect.';
        } else if (err.status === 0) {
          this.errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
        } else {
          this.errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
        }
      }
    });
  }
}
