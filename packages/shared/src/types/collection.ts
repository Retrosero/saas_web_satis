import type { CollectionStatus, CollectionType } from '../enums/common.enum';

export interface Collection {
  id: string;
  tenantId: string;
  collectionNumber: string;
  collectionDate: string;
  customerId: string;
  customerName: string;
  customerTaxNumber: string | null;
  type: CollectionType;
  status: CollectionStatus;
  amount: number;
  currency: string;
  exchangeRate: number;
  linkedSaleId: string | null;
  notes: string | null;
  internalNotes: string | null;
  cancelsCollectionId: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
}
