export interface BankingRequest {
  id: number;
  phoneNumber: string;
  custIden?: string;
  clientName: string;
  email: string;
  serviceType: string;
  modificationType: string;
  otherMessage: string;
  status: string;
  createdDate: string;
  updatedDate: string;
  // Champs système (enrichis depuis clientInfoRepository)
  emailSys?: string;
  firstName?: string;
  lastName?: string;
  agence?: string;
  reference?: string;
  status_create?: string | null;
  status_notif_last_date?: string | null;
}
