import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { BankingRequestService } from '../services/banking-request.service';
import { BankingRequest } from '../models/banking-request.model';
import { AuthService } from '../services/auth.service';


@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatSortModule, MatFormFieldModule, MatInputModule,
    MatIconModule, MatButtonModule, MatCheckboxModule, MatPaginatorModule
  ],
  templateUrl: './request-list.component.html',
  styleUrl: './request-list.component.css'
})
export class RequestListComponent implements OnInit {
  title = 'ACCES MOBILE-WEB BANKING';
  dataSource = new MatTableDataSource<BankingRequest>([]);
  loading = false;
  error: string | null = null;

  /** Toutes les colonnes disponibles avec leur libellé */
  allColumns: { key: string; label: string; selected: boolean }[] = [
    { key: 'createdDate',      label: 'Date Création',     selected: true  },
    { key: 'serviceType',      label: 'Type Service',      selected: true  },
    { key: 'reference',        label: 'Référence',         selected: true  },
    { key: 'agence',           label: 'Agence',            selected: true  },
    { key: 'custIden',         label: 'Code Client',       selected: true  },
    { key: 'phoneNumber',      label: 'Tel Client',        selected: true  },
    { key: 'clientName',       label: 'Nom Client',        selected: true  },
    { key: 'email',            label: 'Email Client',      selected: false },
    { key: 'modificationType', label: 'Type Modification', selected: false },
    { key: 'otherMessage',     label: 'Message',           selected: false },
    { key: 'status_create',    label: 'Statut Création',   selected: false  },
    { key: 'status_notif_last_date', label: 'Dernière Notif', selected: true  },
    { key: 'status',           label: 'Statut',            selected: true  },
  ];

  /** Colonnes actuellement affichées (recalculées à chaque toggle) */
  get displayedColumns(): string[] {
    return this.allColumns.filter(c => c.selected).map(c => c.key);
  }

  /** Ouvre/ferme le panneau de sélection */
  columnMenuOpen = false;

  /** ── Pagination manuelle via Paginator invisible ── */
  paginator!: MatPaginator;
  readonly pageSizeOptions = [2, 10, 25, 50, 100];

  @ViewChild(MatPaginator) set matPaginator(p: MatPaginator) {
    this.dataSource.paginator = p;
    this.paginator = p;
  }

  get totalItems(): number { return this.paginator?.length || 0; }
  get pageSize(): number   { return this.paginator?.pageSize || 25; }
  get currentPage(): number{ return this.paginator?.pageIndex || 0; }
  get totalPages(): number { return this.paginator ? this.paginator.getNumberOfPages() : 1; }

  get startIndex(): number {
    if (!this.paginator) return 0;
    return this.paginator.pageIndex * this.paginator.pageSize;
  }
  
  get endIndex(): number {
    if (!this.paginator) return 0;
    return Math.min((this.paginator.pageIndex + 1) * this.paginator.pageSize, this.totalItems);
  }

  changePageSize(size: string | number): void {
    if (this.paginator) {
      const newSize = Number(size);
      this.paginator.pageSize = newSize;
      this.paginator.pageIndex = 0;
      this.paginator.page.next({
         pageIndex: 0,
         pageSize: newSize,
         length: this.paginator.length
      });
    }
  }

  goToPage(page: number): void {
    if (this.paginator) {
      this.paginator.pageIndex = page;
      this.paginator.page.next({
         pageIndex: page,
         pageSize: this.paginator.pageSize,
         length: this.paginator.length
      });
    }
  }

  private readonly STORAGE_KEY = 'requestList_selectedColumns';

  constructor(
    private bankingRequestService: BankingRequestService,
    private router: Router,
    private authService: AuthService
  ) {}

  /** Charge les préférences sauvegardées dans sessionStorage (réinitialisé par session) */
  private loadColumnPrefs(): void {
    const saved = sessionStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const keys: string[] = JSON.parse(saved);
        this.allColumns.forEach(c => c.selected = keys.includes(c.key));
      } catch { /* ignore */ }
    }
  }

  /** Sauvegarde les préférences dans sessionStorage */
  saveColumnPrefs(): void {
    const keys = this.allColumns.filter(c => c.selected).map(c => c.key);
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(keys));
  }

  selectAllColumns(): void {
    this.allColumns.forEach(c => c.selected = true);
    this.saveColumnPrefs();
  }

  deselectAllColumns(): void {
    this.allColumns.forEach(c => c.selected = false);
    this.saveColumnPrefs();
  }

  @ViewChild(MatSort) set matSort(sort: MatSort) {
    this.dataSource.sort = sort;
  }



  getUserInfo() {
    return this.authService.getUserInfo();
  }

  logout(): void {
    Swal.fire({
      title: 'Déconnexion',
      text: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1a237e',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, me déconnecter',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout();
      }
    });
  }

  ngOnInit(): void {
    this.loadColumnPrefs();
    this.loadBankingRequests();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.paginator) {
      this.paginator.firstPage();
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
