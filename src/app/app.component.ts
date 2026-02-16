import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BankingRequestService } from './services/banking-request.service';
import { BankingRequest } from './models/banking-request.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'Banking Requests';
  bankingRequests: BankingRequest[] = [];
  loading = false;
  error: string | null = null;

  constructor(private bankingRequestService: BankingRequestService) {}

  ngOnInit(): void {
    this.loadBankingRequests();
  }

  loadBankingRequests(): void {
    this.loading = true;
    this.error = null;

    this.bankingRequestService.getAllBankingRequests().subscribe({
      next: (data) => {
        this.bankingRequests = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load banking requests. Please ensure the backend server is running.';
        this.loading = false;
        console.error('Error loading banking requests:', err);
      }
    });
  }
}
