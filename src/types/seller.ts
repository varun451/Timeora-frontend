export type ApplicationStatus = "pending" | "approved" | "rejected";
export type SellerStatus = "active" | "suspended";

export interface BusinessAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface KYCInfo {
  pan: string;
  gstin?: string;
  verified?: boolean;
}

export interface BankDetails {
  accountHolderName: string;
  accountNumber?: string;
  accountNumberLast4?: string;
  ifscCode: string;
  bankName: string;
}

export interface SellerApplication {
  id: string;
  userId?: string;
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  description?: string;
  businessAddress: BusinessAddress;
  kyc: KYCInfo;
  bankDetails: BankDetails;
  status: ApplicationStatus;
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface Seller {
  id: string;
  userId: string;
  storeName: string;
  slug: string;
  ownerName: string;
  email: string;
  phone: string;
  description?: string;
  businessAddress?: BusinessAddress;
  kyc?: KYCInfo;
  bankDetails?: BankDetails;
  status: SellerStatus;
  commissionBps?: number;
  suspensionReason?: string;
  productCount?: number;
  approvedAt?: string;
  createdAt?: string;
}

