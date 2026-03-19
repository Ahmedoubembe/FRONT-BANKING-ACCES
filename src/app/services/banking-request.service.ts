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

  /** Récupère les demandes selon le rôle de l'utilisateur connecté.
   *  ROLE_ADMIN → /all (toutes les demandes)
   *  ROLE_CHEF_AGENCE → /agence/{agence} (filtrées par agence)
   */
  getRequestsByAgence(): Observable<BankingRequest[]> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    if (this.authService.isAdmin()) {
      return this.http
        .get<BankingRequestResponse>(`${this.baseUrl}/all`, { headers })
        .pipe(map((response: BankingRequestResponse) => response.data));
    }

    const agence = this.authService.getAgence();
    if (!agence) {
      throw new Error('Aucune agence trouvée pour cet utilisateur.');
    }
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
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http
      .get<{ success: boolean; data: { id: number; fileName: string; fileSize: number; uploadedAt: string }[] }>(
        `${this.baseUrl}/${id}/justificatifs`,
        { headers }
      )
      .pipe(map(response => (response.data || []).map(f => f.fileName)));
  }

  /** Télécharge un fichier justificatif en tant que Blob (contourne X-Frame-Options) */
  downloadJustificatifBlob(id: number, fileName: string): Observable<Blob> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get(
      `${this.baseUrl}/${id}/justificatifs/${encodeURIComponent(fileName)}`,
      { headers, responseType: 'blob' }
    );
  }
}
