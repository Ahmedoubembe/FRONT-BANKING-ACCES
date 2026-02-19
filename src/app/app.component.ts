import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BankingRequestService } from './services/banking-request.service';
import { BankingRequest } from './models/banking-request.model';

import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatSortModule, MatFormFieldModule, MatInputModule, MatIconModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'ACCES MOBILE-WEB BANKING';
  dataSource = new MatTableDataSource<BankingRequest>([]);
  displayedColumns: string[] = ['id', 'phoneNumber', 'clientName', 'email', 'serviceType', 'modificationType', 'otherMessage', 'createdDate', 'status'];
  loading = false;
  error: string | null = null;

  @ViewChild(MatSort) set matSort(sort: MatSort) {
    this.dataSource.sort = sort;
  }

  constructor(private bankingRequestService: BankingRequestService) {}

  ngOnInit(): void {
    this.loadBankingRequests();
  }

  ngAfterViewInit() {
    // Left empty or can be removed if not needed 
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
        this.error = 'Failed to load banking requests. Please ensure the backend server is running.';
        this.loading = false;
        console.error('Error loading banking requests:', err);
      }
    });
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
    if (serviceType && serviceType.includes('MOBILE')) {
      return 'service-mobile';
    } else if (serviceType && serviceType.includes('WEB')) {
      return 'service-web';
    }
    return '';
  }
}
