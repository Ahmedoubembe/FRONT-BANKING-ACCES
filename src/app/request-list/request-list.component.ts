import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { BankingRequestService } from '../services/banking-request.service';
import { BankingRequest } from '../models/banking-request.model';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatSortModule, MatFormFieldModule, MatInputModule, MatIconModule],
  templateUrl: './request-list.component.html',
  styleUrl: './request-list.component.css'
})
export class RequestListComponent implements OnInit {
  title = 'ACCES MOBILE-WEB BANKING';
  dataSource = new MatTableDataSource<BankingRequest>([]);
  displayedColumns: string[] = ['createdDate', 'serviceType', 'reference', 'agence', 'custIden', 'phoneNumber', 'clientName', 'email','status'];
  loading = false;
  error: string | null = null;

  @ViewChild(MatSort) set matSort(sort: MatSort) {
    this.dataSource.sort = sort;
  }

  constructor(
    private bankingRequestService: BankingRequestService,
    private router: Router,
    private authService: AuthService
  ) {}

  getUserInfo() {
    return this.authService.getUserInfo();
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnInit(): void {
    this.loadBankingRequests();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  loadBankingRequests(): void {
    this.loading = true;
    this.error = null;
    this.bankingRequestService.getAllBankingRequests().subscribe({
      next: (data: BankingRequest[]) => {
        this.dataSource.data = data;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Impossible de charger les demandes. Vérifiez que le serveur backend est démarré.';
        this.loading = false;
        console.error('Error loading banking requests:', err);
      }
    });
  }

  navigateToDetail(request: BankingRequest): void {
    localStorage.setItem('selectedRequest', JSON.stringify(request));
    this.router.navigate(['/request', request.id]);
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'EN ATTENTE',
      'VALIDATED': 'VALIDÉE',
      'PROCESSED': 'TRAITÉE',
      'REJECTED': 'REJETÉE'
    };
    return statusMap[status] || status;
  }

  getServiceClass(serviceType: string): string {
    if (serviceType && serviceType.includes('MOBILE')) return 'service-mobile';
    if (serviceType && serviceType.includes('WEB')) return 'service-web';
    return '';
  }
}
