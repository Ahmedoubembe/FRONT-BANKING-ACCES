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
    try {
      this.bankingRequestService.getRequestsByAgence().subscribe({
        next: (data: BankingRequest[]) => {
          this.dataSource.data = data.reverse();
          this.loading = false;
        },
        error: (err: any) => {
          this.error = 'Impossible de charger les demandes de votre agence. Vérifiez que le serveur backend est démarré.';
          this.loading = false;
          console.error('Erreur lors du chargement des demandes par agence :', err);
        }
      });
    } catch (e: any) {
      this.error = e.message ?? 'Aucune agence associée à cet utilisateur.';
      this.loading = false;
    }
  }

  navigateToDetail(request: BankingRequest): void {
    localStorage.setItem('selectedRequest', JSON.stringify(request));
    this.router.navigate(['/request', request.id]);
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING':        'EN ATTENTE',
      'VALIDATED':      'VALIDÉE',
      'PROCESSED':      'TRAITÉE',
      'REJECTED':       'REJETÉE',
      'CLIENT NOTIFIÉ': 'CLIENT NOTIFIÉ',
      'NON DEMANDÉ':    'NON DEMANDÉ'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    return 'status-' + (status || '').toLowerCase().replace(/ /g, '_');
  }

  getStatusIcon(status: string): string {
    if (status === 'CLIENT NOTIFIÉ') return '✓ ';
    if (status === 'NON DEMANDÉ')    return '';
    return '';
  }

  getStatusStyle(status: string): { [key: string]: string } {
    const green  = { background: 'linear-gradient(135deg, #C8E6C9, #A5D6A7)', color: '#1B5E20', border: '2px solid #66BB6A' };
    const danger  = { background: 'linear-gradient(135deg, #FFCDD2, #EF9A9A)', color: '#B71C1C', border: '2px solid #E53935' };
    const styles: { [key: string]: { [key: string]: string } } = {
      'PENDING':        { background: 'linear-gradient(135deg, #FFF4E5, #FFE8CC)', color: '#E65100', border: '2px solid #FFB74D' },
      'VALIDATED':      { background: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)', color: '#2E7D32', border: '2px solid #81C784' },
      'PROCESSED':      { background: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)', color: '#1565C0', border: '2px solid #64B5F6' },
      'REJECTED':       { background: 'linear-gradient(135deg, #FFEBEE, #FFCDD2)', color: '#C62828', border: '2px solid #E57373' },
      'CLIENT NOTIFIÉ': green,
      'NON DEMANDÉ':    danger,
      // fallback variantes sans accents
      'CLIENT NOTIFIE': green,
      'CLIENT_NOTIFIE': green,
      'NON DEMANDE':    danger,
      'NON_DEMANDE':    danger
    };
    return styles[status] || { background: 'linear-gradient(135deg, #F5F5F5, #EEEEEE)', color: '#616161', border: '2px solid #bdbdbd' };
  }

  getServiceClass(serviceType: string): string {
    if (serviceType && serviceType.includes('MOBILE')) return 'service-mobile';
    if (serviceType && serviceType.includes('WEB')) return 'service-web';
    return '';
  }
}
