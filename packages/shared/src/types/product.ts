import type { PriceType, ProductStatus, ProductType, UnitType, WarehouseStatus } from '../enums/common.enum.js';

export interface Unit {
  id: string;
  tenantId: string | null;
  code: string;
  name: string;
  type: UnitType;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
}

export interface Brand {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  country: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  status: WarehouseStatus;
  address: string | null;
  city: string | null;
  manager: string | null;
  phone: string | null;
  isDefault: boolean;
  notes: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  shortName: string | null;
  description: string | null;
  type: ProductType;
  status: ProductStatus;
  brandId: string | null;
  categoryId: string | null;
  defaultWarehouseId: string | null;
  unitId: string | null;
  primaryBarcode: string | null;
  trackStock: boolean;
  vatRate: number;
  minStock: number;
  maxStock: number;
  weight: number | null;
  volume: number | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPrice {
  id: string;
  tenantId: string;
  productId: string;
  type: PriceType;
  amount: number;
  currency: string;
  validFrom: string;
  validTo: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductBarcode {
  id: string;
  tenantId: string;
  productId: string;
  barcode: string;
  unitId: string | null;
  quantity: number;
  isPrimary: boolean;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  tenantId: string;
  productId: string;
  warehouseId: string;
  type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUST';
  quantity: number;
  unitCost: number | null;
  movementDate: string;
  refType: string;
  refId: string | null;
  refNumber: string | null;
  description: string | null;
  status: 'DRAFT' | 'POSTED' | 'PENDING' | 'CANCELLED';
  transferToWarehouseId: string | null;
  reversesId: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
