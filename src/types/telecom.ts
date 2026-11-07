export type Operator = 'GP' | 'Robi' | 'Banglalink' | 'Airtel' | 'Teletalk' | 'Skitto';

export type SimType = 'Prepaid' | 'Postpaid';

export type PaymentMethod = 'bKash' | 'Nagad' | 'Rocket' | 'Upay';

export type OfferCategory = 'combo' | 'internet' | 'minute' | 'cashback' | 'special';

export type NidServiceType = 'nid_pdf' | 'server_copy' | 'user_pass_set' | string;

export interface CustomServiceField {
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
  type: 'text' | 'number' | 'date' | 'tel';
}

export interface DigitalServiceItem {
  id: string;
  title: string;
  description: string;
  fee: number;
  category: 'nid' | 'certificate' | 'gov' | 'other';
  icon: string;
  fields: CustomServiceField[];
  active: boolean;
  isSystemDefault?: boolean;
  createdAt?: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'user' | 'admin';
  balance: number;
  createdAt: string;
}

export interface DriveOffer {
  id: string;
  operator: Operator;
  title: string;
  category: OfferCategory;
  description?: string;
  regularPrice: number;
  offerPrice: number;
  cashback?: number;
  validity: string;
  division: string;
  commission?: number;
  tag?: string;
  active: boolean;
  createdAt?: string;
}

export interface AddMoneyRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  method: PaymentMethod;
  senderNumber: string;
  amount: number;
  trxId: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
  adminNote?: string;
}

export interface RechargeRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  type: 'recharge' | 'drive_offer';
  operator: Operator | 'All';
  targetPhone: string;
  simType: SimType;
  amount: number;
  offerId?: string;
  offerTitle?: string;
  offerCategory?: OfferCategory;
  customerNote?: string;
  status: 'pending' | 'completed' | 'rejected';
  timestamp: string;
  completedAt?: string;
  trxId: string;
  note?: string;
}

export interface NidOrderRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  serviceId?: string;
  serviceType: NidServiceType;
  serviceTitle: string;
  fee: number;
  formData?: Record<string, string>;
  name?: string; // NID PDF
  nidNumber: string; // NID PDF, Server Copy, User Pass Set
  dateOfBirth: string; // NID PDF, Server Copy, User Pass Set
  upazila?: string; // NID PDF, User Pass Set
  district?: string; // NID PDF, User Pass Set
  status: 'pending' | 'completed' | 'rejected';
  timestamp: string;
  completedAt?: string;
  trxId: string;
  deliveryFileUrl?: string;
  pdfFileName?: string;
  pdfFileSize?: string;
  pdfDataUrl?: string; // Real Base64 or Blob Data URL for direct download
  deliveryNote?: string;
  adminRemarks?: string;
}

export interface AdminNotification {
  id: string;
  type: 'recharge' | 'drive_offer' | 'nid_order' | 'add_money' | 'system';
  title: string;
  message: string;
  amount?: number;
  customerName: string;
  customerPhone: string;
  targetRefId?: string;
  timestamp: string;
  read: boolean;
}

export interface NotificationSettings {
  soundEnabled: boolean;
  browserNotificationsEnabled: boolean;
  notifyOnRecharge: boolean;
  notifyOnDriveOffer: boolean;
  notifyOnNidOrder: boolean;
  notifyOnAddMoney: boolean;
}

export interface AppSettings {
  noticeText: string;
  noticeEnabled: boolean;
  paymentNumbers: {
    bKash: string;
    Nagad: string;
    Rocket: string;
    Upay: string;
  };
  nidFees: {
    nid_pdf: number;
    server_copy: number;
    user_pass_set: number;
    [key: string]: number;
  };
  notifications: NotificationSettings;
  whatsappNumber: string;
}
