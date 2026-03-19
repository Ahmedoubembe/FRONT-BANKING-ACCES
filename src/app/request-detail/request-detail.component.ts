import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer as NgDomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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

  // ── Fichiers joints (demande TRAITÉE) ─────────────────────
  jointFiles: string[] = [];
  loadingFiles = false;

  // ── Modale aperçu ───────────────────────────────────────
  previewUrl: SafeResourceUrl | null = null;
  previewType: 'pdf' | 'image' | null = null;
  previewName = '';
  showPreview = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bankingService: BankingRequestService,
    private authService: AuthService,
    private sanitizer: NgDomSanitizer
  ) {}

  /** Retourne true si l'utilisateur est en mode lecture seule (ROLE_ADMIN ou ROLE_CHEF_AGENCE) */
  get isReadOnly(): boolean {
    return this.authService.isAdmin() || this.authService.isChefAgence();
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
      return;
    }
    // Charger les fichiers joints si la demande est traitée ou validée
    const statusesWithFiles = ['PROCESSED', 'TRAITÉE', 'VALIDATED', 'VALIDÉE'];
    if (statusesWithFiles.includes(this.request.status)) {
      this.loadJointFiles();
    }
  }

  /** Charge la liste des fichiers joints depuis l'API */
  loadJointFiles(): void {
    if (!this.request) return;
    this.loadingFiles = true;
    this.bankingService.getJustificatifs(this.request.id).subscribe({
      next: (files) => {
        this.jointFiles = files || [];
        this.loadingFiles = false;
      },
      error: () => {
        this.jointFiles = [];
        this.loadingFiles = false;
      }
    });
  }

  /** Ouvre l'aperçu d'un fichier joint.
   *  On télécharge le fichier en Blob pour contourner X-Frame-Options. */
  openPreview(fileName: string): void {
    if (!this.request) return;
    this.previewName = fileName;
    this.previewType = null;
    this.previewUrl = null;
    this.showPreview = true;          // ouvre la modale avec état "chargement"

    this.bankingService.downloadJustificatifBlob(this.request.id, fileName).subscribe({
      next: (blob) => {
        // Révoquer l'ancienne blob URL si elle existe
        const prev = this._blobUrl;
        if (prev) { URL.revokeObjectURL(prev); }

        const blobUrl = URL.createObjectURL(blob);
        this._blobUrl = blobUrl;
        const lower = fileName.toLowerCase();
        this.previewType = lower.endsWith('.pdf') ? 'pdf' : 'image';
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
      },
      error: () => {
        this.showPreview = false;
        alert('Impossible de charger le fichier.');
      }
    });
  }

  /** URL brute de la dernière blob créée (pour révocation mémoire) */
  private _blobUrl: string | null = null;

  closePreview(): void {
    this.showPreview = false;
    this.previewUrl = null;
    this.previewType = null;
    this.previewName = '';
    if (this._blobUrl) {
      URL.revokeObjectURL(this._blobUrl);
      this._blobUrl = null;
    }
  }

  getJointFileIcon(fileName: string): string {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.pdf')) return 'assets/pdf-icon.png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png')) return '🖼️';
    return '📎';
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
    if (file.type === 'application/pdf') return 'assets/pdf-icon.png';
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
      'PENDING':        'EN ATTENTE',
      'VALIDATED':      'VALIDÉE',
      'PROCESSED':      'TRAITÉE',
      'REJECTED':       'REJETÉE',
      'CLIENT NOTIFIÉ': 'CLIENT NOTIFIÉ',
      'NON DEMANDÉ':    'NON DEMANDÉ'
    };
    return statusMap[status] || status;
  }

  getServiceClass(serviceType: string): string {
    if (serviceType && serviceType.includes('MOBILE')) return 'service-mobile';
    if (serviceType && serviceType.includes('WEB')) return 'service-web';
    return '';
  }

  getStatusClass(status: string): string {
    return 'status-' + (status || '').toLowerCase().replace(/ /g, '_');
  }

  getStatusIcon(status: string): string {
    if (status === 'CLIENT NOTIFIÉ' || status === 'CLIENT NOTIFIE' || status === 'CLIENT_NOTIFIE') return '✓ ';
    if (status === 'NON DEMANDÉ'    || status === 'NON DEMANDE'    || status === 'NON_DEMANDE')    return '⚠️ ';
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
      'CLIENT NOTIFIÉ': green, 'CLIENT NOTIFIE': green, 'CLIENT_NOTIFIE': green,
      'NON DEMANDÉ':    danger, 'NON DEMANDE':    danger, 'NON_DEMANDE':    danger
    };
    return styles[status] || { background: 'linear-gradient(135deg, #F5F5F5, #EEEEEE)', color: '#616161', border: '2px solid #bdbdbd' };
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
  <base href="${window.location.origin}/">
  <title>Demande ${val(r.reference)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1B5E20; background: #fff; padding: 30px; font-size: 13px; }
    .pdf-header { text-align: center; padding: 10px 0 16px; border-bottom: 3.5px solid #FBC02D; margin-bottom: 22px; position: relative; }
    .pdf-header::after { content: ''; position: absolute; bottom: -3.5px; left: 0; width: 30%; height: 3.5px; background: #1B5E20; }
    .logo-container { margin-bottom: 12px; }
    .logo-img { height: 55px; object-fit: contain; }
    .pdf-header h1 { font-size: 20px; font-weight: 800; color: #1B5E20; letter-spacing: 1px; text-transform: uppercase; }
    .pdf-header .ref { display: inline-block; margin-top: 8px; background: #f1f8f1; border: 1.5px solid #A5D6A7; border-radius: 20px; padding: 4px 16px; font-size: 13px; font-weight: 700; font-family: 'Courier New', monospace; color: #1B5E20; }
    .pdf-header .badges { margin-top: 10px; display: flex; justify-content: center; gap: 12px; }
    .badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    
    .status-pending { background: #FFF4E5; color: #E65100; border: 1.5px solid #FFB74D; }
    .status-validated { background: #E8F5E9; color: #2E7D32; border: 1.5px solid #81C784; }
    .status-processed { background: #E3F2FD; color: #1565C0; border: 1.5px solid #64B5F6; }
    .status-rejected { background: #FFEBEE; color: #C62828; border: 1.5px solid #E57373; }
    .status-client_notifie { background: #E8F5E9; color: #1B5E20; border: 1.5px solid #81C784; }
    .status-non_demande { background: #FFF3E0; color: #E65100; border: 1.5px solid #FFB74D; }
    
    .service-mobile { background: #DCEDC8; color: #33691E; border: 1.5px solid #AED581; }
    .service-web { background: #E3F2FD; color: #0D47A1; border: 1.5px solid #42A5F5; }
    
    .section { margin-bottom: 25px; border: 1px solid #e0e8e0; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
    .section-header { display: flex; align-items: center; gap: 10px; padding: 12px 18px; font-size: 13px; font-weight: 700; border-bottom: 1px solid #e0e8e0; }
    .section-header.client { background: linear-gradient(135deg, #f1f8f1, #e8f5e9); color: #1B5E20; }
    .section-header.system { background: linear-gradient(135deg, #f1f8f1, #e8f5e9); color: #1B5E20; border-left: 4px solid #FBC02D; }
    .section-header.demande { background: linear-gradient(135deg, #f1f8f1, #e8f5e9); color: #1B5E20; border-left: 4px solid #388E3C; }
    
    .grid { display: grid; grid-template-columns: 1fr 1fr; background: #fff; }
    .item { padding: 12px 18px; border-bottom: 1px solid #f5f5f5; }
    .item.full { grid-column: span 2; }
    .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #7CB342; margin-bottom: 4px; }
    .value { font-size: 13px; font-weight: 600; color: #263238; }
    .pdf-footer { margin-top: 35px; padding-top: 15px; border-top: 1px solid #e0e8e0; display: flex; justify-content: space-between; font-size: 10px; color: #78909c; }
    .no-info { padding: 20px; color: #90a4ae; font-style: italic; text-align: center; background: #fafafa; }
  </style>
</head>
<body>
  <div class="pdf-header">
    <div class="logo-container">
      <img src="assets/bamis-logo.png" class="logo-img" alt="Bamis Logo">
    </div>
    <h1>Détail de la Demande Bancaire</h1>
    <div class="ref">Réf: ${val(r.reference)}</div>
    <div class="badges">
      <span class="badge ${r.serviceType?.includes('MOBILE') ? 'service-mobile' : 'service-web'}">${val(r.serviceType)}</span>
      <span class="badge status-${(r.status || '').toLowerCase().replace(/ /g, '_')}">
        ${r.status === 'CLIENT NOTIFIE' ? '✓ ' : r.status === 'NON DEMANDE' ? '⚠️ ' : ''}${this.getStatusLabel(r.status)}
      </span>
    </div>
  </div>
  <div class="section">
    <div class="section-header client"><span></span> Informations Client (saisies)</div>
    <div class="grid">
      <div class="item"><div class="label">Nom Client</div><div class="value">${val(r.clientName)}</div></div>
      <div class="item"><div class="label">Téléphone</div><div class="value">${val(r.phoneNumber)}</div></div>
      <div class="item full"><div class="label">Email</div><div class="value">${val(r.email)}</div></div>
    </div>
  </div>
  <div class="section">
    <div class="section-header demande"><span></span> Informations de la Demande</div>
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
    <div class="section-header system"><span></span> Informations Système</div>
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
