import type {
  CampaignStatus,
  CampaignType,
  DiscountType,
  PriceListStatus,
} from '../enums/pricing.enum';

export interface PriceList {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  currency: string;
  validFrom: string | null;
  validTo: string | null;
  customerGroupId: string | null;
  description: string | null;
  status: PriceListStatus;
  itemCount: number;
  isDeleted: boolean;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PriceListItem {
  id: string;
  priceListId: string;
  productId: string;
  productCode: string;
  productName: string;
  barcode: string | null;
  oldPrice: number | null;
  newPrice: number;
  vatRate: number;
  minQuantity: number;
  maxDiscountRate: number;
}

export interface CustomerPriceGroup {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description: string | null;
  defaultPriceListId: string | null;
  defaultDiscountRate: number;
  memberCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface Campaign {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  campaignType: CampaignType;
  startDate: string;
  endDate: string;
  customerGroupId: string | null;
  customerId: string | null;
  productId: string | null;
  minQuantity: number;
  minCartAmount: number;
  discountType: DiscountType;
  discountRate: number;
  discountAmount: number;
  maxUsageCount: number;
  perUserLimit: number;
  usageCount: number;
  description: string | null;
  status: CampaignStatus;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignTestResult {
  appliedCampaign: Campaign | null;
  originalAmount: number;
  discountAmount: number;
  netAmount: number;
  reason: string;
}
