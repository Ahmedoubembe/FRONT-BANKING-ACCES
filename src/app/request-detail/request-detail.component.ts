import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BankingRequest } from '../models/banking-request.model';
import { BankingRequestService } from '../services/banking-request.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './request-detail.component.html',
  styleUrl: './request-detail.component.css'
})
export class RequestDetailComponent implements OnInit {
  request: BankingRequest | null = null;

  // ── Upload ──────────────────────────────────────────────
  selectedFiles: File[] = [];
  uploadedFileNames: string[] = [];
  uploading = false;
  uploadSuccess = false;
  uploadError: string | null = null;
  closing = false;
  closeSuccess = false;
  closeError: string | null = null;
  isDragOver = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bankingService: BankingRequestService,
    private authService: AuthService
  ) {}

  /** Retourne true si l'utilisateur connecté a le rôle ROLE_ADMIN */
  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const stored = localStorage.getItem('selectedRequest');
      if (stored) {
        const parsed: BankingRequest = JSON.parse(stored);
        if (parsed.id === Number(id)) {
          this.request = parsed;
        }
      }
    }
    if (!this.request) {
      this.router.navigate(['/']);
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  // ── Upload Logic ─────────────────────────────────────────

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(Array.from(input.files));
      input.value = '';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(): void {
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    if (event.dataTransfer?.files) {
      this.addFiles(Array.from(event.dataTransfer.files));
    }
  }

  private addFiles(files: File[]): void {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const newFiles = files.filter(f =>
      allowed.includes(f.type) && !this.selectedFiles.find(s => s.name === f.name)
    );
    this.selectedFiles = [...this.selectedFiles, ...newFiles];
    this.uploadError = null;
  }

  removeFile(index: number): void {
    this.selectedFiles = this.selectedFiles.filter((_, i) => i !== index);
  }

  getFileIcon(file: File): string {
    if (file.type === 'application/pdf') return '📄';
    if (file.type.startsWith('image/')) return '🖼️';
    return '📎';
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  }

  resetUpload(): void {
    this.uploadSuccess = false;
    this.uploadedFileNames = [];
    this.selectedFiles = [];
    this.uploadError = null;
  }

  canUpload(): boolean {
    return this.selectedFiles.length > 0 && !this.uploading && !this.uploadSuccess;
  }

  canClose(): boolean {
    return this.uploadSuccess && !this.closeSuccess;
  }

  uploadFiles(): void {
    if (!this.request || !this.canUpload()) return;
    this.uploading = true;
    this.uploadError = null;

    this.bankingService.uploadJustificatifs(this.request.id, this.selectedFiles).subscribe({
      next: (res) => {
        this.uploading = false;
        this.uploadSuccess = true;
        this.uploadedFileNames = res.uploadedFiles || this.selectedFiles.map(f => f.name);
        this.selectedFiles = [];
      },
      error: (err) => {
        this.uploading = false;
        this.uploadError = 'Erreur lors de l\'upload. Veuillez réessayer.';
      }
    });
  }

  closeRequest(): void {
    if (!this.request || !this.canClose()) return;
    this.closing = true;
    this.closeError = null;

    this.bankingService.closeRequest(this.request.id).subscribe({
      next: () => {
        this.closing = false;
        this.closeSuccess = true;
        if (this.request) {
          this.request = { ...this.request, status: 'PROCESSED' };
          localStorage.setItem('selectedRequest', JSON.stringify(this.request));
        }
      },
      error: () => {
        this.closing = false;
        this.closeError = 'Erreur lors de la clôture. Veuillez réessayer.';
      }
    });
  }

  // ── Helpers ──────────────────────────────────────────────

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

  getStatusClass(status: string): string {
    return 'status-' + (status || '').toLowerCase();
  }

  hasSystemInfo(): boolean {
    return !!(this.request?.custIden || this.request?.emailSys || this.request?.firstName || this.request?.lastName || this.request?.agence || this.request?.reference);
  }

  printRequest(): void {
    if (!this.request) return;
    const r = this.request;

    const fmt = (d: any): string => {
      if (!d) return '—';
      const dt = new Date(d);
      const dd = String(dt.getDate()).padStart(2, '0');
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const yyyy = dt.getFullYear();
      const hh = String(dt.getHours()).padStart(2, '0');
      const min = String(dt.getMinutes()).padStart(2, '0');
      return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    };
    const val = (v: any) => v || '—';

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Demande ${val(r.reference)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 30px; font-size: 13px; }
    .pdf-header { text-align: center; padding: 20px 0 16px; border-bottom: 3px solid #1a237e; margin-bottom: 22px; }
    .pdf-header h1 { font-size: 20px; font-weight: 800; color: #1a237e; letter-spacing: 1px; }
    .pdf-header .ref { display: inline-block; margin-top: 6px; background: #f4f6f8; border: 1.5px solid #cfd8dc; border-radius: 20px; padding: 3px 14px; font-size: 12px; font-weight: 700; font-family: 'Courier New', monospace; color: #37474f; }
    .pdf-header .badges { margin-top: 8px; display: flex; justify-content: center; gap: 10px; }
    .badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .status-pending { background: #FFF4E5; color: #E65100; border: 1.5px solid #FFB74D; }
    .status-validated { background: #E8F5E9; color: #2E7D32; border: 1.5px solid #81C784; }
    .status-processed { background: #E3F2FD; color: #1565C0; border: 1.5px solid #64B5F6; }
    .status-rejected { background: #FFEBEE; color: #C62828; border: 1.5px solid #E57373; }
    .service-mobile { background: #DCEDC8; color: #33691E; border: 1.5px solid #AED581; }
    .service-web { background: #E3F2FD; color: #0D47A1; border: 1.5px solid #42A5F5; }
    .section { margin-bottom: 20px; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; }
    .section-header { display: flex; align-items: center; gap: 10px; padding: 12px 16px; font-size: 13px; font-weight: 700; }
    .section-header.client { background: linear-gradient(135deg, #E3F2FD, #BBDEFB); color: #1a237e; }
    .section-header.system { background: linear-gradient(135deg, #E8F5E9, #C8E6C9); color: #1B5E20; }
    .section-header.demande { background: linear-gradient(135deg, #FFF8E1, #FFECB3); color: #E65100; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; }
    .item { padding: 10px 16px; border-bottom: 1px solid #f0f0f0; }
    .item.full { grid-column: span 2; }
    .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #90a4ae; margin-bottom: 3px; }
    .value { font-size: 13px; font-weight: 600; color: #263238; }
    .pdf-footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e0e0e0; display: flex; justify-content: space-between; font-size: 10px; color: #90a4ae; }
    .no-info { padding: 16px; color: #90a4ae; font-style: italic; text-align: center; }
  </style>
</head>
<body>
  <div class="pdf-header">
    <h1>Détail de la Demande Bancaire</h1>
    <div class="ref"># ${val(r.reference)}</div>
    <div class="badges">
      <span class="badge ${r.serviceType?.includes('MOBILE') ? 'service-mobile' : 'service-web'}">${val(r.serviceType)}</span>
      <span class="badge status-${(r.status || '').toLowerCase()}">${this.getStatusLabel(r.status)}</span>
    </div>
  </div>
  <div class="section">
    <div class="section-header client"><span>👤</span> Informations Client (saisies)</div>
    <div class="grid">
      <div class="item"><div class="label">Nom Client</div><div class="value">${val(r.clientName)}</div></div>
      <div class="item"><div class="label">Téléphone</div><div class="value">${val(r.phoneNumber)}</div></div>
      <div class="item full"><div class="label">Email</div><div class="value">${val(r.email)}</div></div>
    </div>
  </div>
  <div class="section">
    <div class="section-header demande"><span>📋</span> Informations de la Demande</div>
    <div class="grid">
      <div class="item"><div class="label">ID</div><div class="value">${val(r.id)}</div></div>
      <div class="item"><div class="label">Référence</div><div class="value">${val(r.reference)}</div></div>
      <div class="item"><div class="label">Type Service</div><div class="value">${val(r.serviceType)}</div></div>
      <div class="item"><div class="label">Type Modification</div><div class="value">${val(r.modificationType)}</div></div>
      <div class="item"><div class="label">Date Création</div><div class="value">${fmt(r.createdDate)}</div></div>
      <div class="item"><div class="label">Mise à Jour</div><div class="value">${fmt(r.updatedDate)}</div></div>
      ${r.otherMessage ? `<div class="item full"><div class="label">Message</div><div class="value">${r.otherMessage}</div></div>` : ''}
    </div>
  </div>
  <div class="section">
    <div class="section-header system"><span>🖥️</span> Informations Système</div>
    ${this.hasSystemInfo() ? `
    <div class="grid">
      <div class="item"><div class="label">Code Client</div><div class="value">${val(r.custIden)}</div></div>
      <div class="item"><div class="label">Agence</div><div class="value">${val(r.agence)}</div></div>
      <div class="item"><div class="label">Prénom</div><div class="value">${val(r.firstName)}</div></div>
      <div class="item"><div class="label">Nom</div><div class="value">${val(r.lastName)}</div></div>
      <div class="item full"><div class="label">Email Système</div><div class="value">${val(r.emailSys)}</div></div>
    </div>` : `<div class="no-info">⚠️ Aucune donnée système disponible.</div>`}
  </div>
  <div class="pdf-footer">
    <span>Généré le ${fmt(new Date())}</span>
    <span>Système de Gestion des Demandes Bancaires</span>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
        win.addEventListener('afterprint', () => win.close());
      }, 500);
    }
  }
}
