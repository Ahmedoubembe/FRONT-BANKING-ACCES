import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BankingRequest } from '../models/banking-request.model';

@Injectable({
  providedIn: 'root'
})
export class BankingRequestService {
  private apiUrl = 'http://localhost:8077/banking_access/api/banking-requests/all';

  constructor(private http: HttpClient) { }

  getAllBankingRequests(): Observable<BankingRequest[]> {
    return this.http.get<BankingRequest[]>(this.apiUrl);
  }
}
