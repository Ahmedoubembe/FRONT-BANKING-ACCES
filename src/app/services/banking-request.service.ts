import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BankingRequest } from '../models/banking-request.model';

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

  constructor(private http: HttpClient) { }

  getAllBankingRequests(): Observable<BankingRequest[]> {
    return this.http.get<BankingRequestResponse>(this.apiUrl).pipe(
      map((response: BankingRequestResponse) => response.data)
    );
  }
}
