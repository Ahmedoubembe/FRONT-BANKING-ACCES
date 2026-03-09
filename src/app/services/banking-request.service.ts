import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BankingRequest } from '../models/banking-request.model';
import { AuthService } from './auth.service';

interface BankingRequestResponse {
  total: number;
  data: BankingRequest[];
}

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BankingRequestService {
  private apiUrl = environment.apiUrl + '/all';
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) { }

  /** Récupère les demandes filtrées par agence de l'utilisateur connecté. */
  getRequestsByAgence(): Observable<BankingRequest[]> {
    const agence = this.authService.getAgence();
    const token = this.authService.getToken();
    if (!agence) {
      throw new Error('Aucune agence trouvée pour cet utilisateur.');
    }
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http
      .get<BankingRequestResponse>(`${this.baseUrl}/agence/${encodeURIComponent(agence)}`, { headers })
      .pipe(map((response: BankingRequestResponse) => response.data));
  }

  getAllBankingRequests(): Observable<BankingRequest[]> {
    return this.http.get<BankingRequestResponse>(this.apiUrl).pipe(
      map((response: BankingRequestResponse) => response.data)
    );
  }

  uploadJustificatifs(id: number, files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file, file.name));
    return this.http.post(`${this.baseUrl}/${id}/justificatifs`, formData);
  }

  closeRequest(id: number): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${id}/close`, {});
  }

  /** Récupère la liste des noms de fichiers justificatifs d'une demande */
  getJustificatifs(id: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/${id}/justificatifs`);
  }

  /** Retourne l'URL pour accéder à un fichier justificatif */
  getJustificatifUrl(id: number, fileName: string): string {
    return `${this.baseUrl}/${id}/justificatifs/${encodeURIComponent(fileName)}`;
  }
}
