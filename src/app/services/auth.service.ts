import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  nomUtilisateur: string;
  prenom: string;
  nom: string;
  email: string;
  agence: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authApiUrl = environment.authApiUrl;

  constructor(private http: HttpClient, private router: Router) {}

  login(login: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authApiUrl}/signin`, { login, password }).pipe(
      tap((response: AuthResponse) => {
        // .trim() est IMPORTANT : le backend peut retourner le token avec des \n ou espaces
        localStorage.setItem('token', response.token.trim());
        const user = {
          username: `${response.prenom} ${response.nom}`.trim() || response.nomUtilisateur,
          nomUtilisateur: response.nomUtilisateur,
          agence: response.agence ?? '',
          roles: response.roles ?? []
        };
        localStorage.setItem('user', JSON.stringify(user));
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token')?.trim() ?? null;
  }

  getUserInfo(): { username: string; nomUtilisateur: string; agence: string; roles: string[] } | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  getAgence(): string | null {
    return this.getUserInfo()?.agence ?? null;
  }

  hasRole(role: string): boolean {
    return this.getUserInfo()?.roles?.includes(role) ?? false;
  }

  isAdmin(): boolean {
    return this.hasRole('ROLE_ADMIN');
  }

  isGestionnaire(): boolean {
    return this.hasRole('ROLE_GESTIONNAIRE');
  }
}
