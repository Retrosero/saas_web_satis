import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsNumber, IsOptional, IsPositive, IsString, ValidateNested } from 'class-validator';
import type { PaymentStatus, PurchaseInvoiceStatus, PurchaseInvoiceType } from '@saas/shared';

export class CreatePurchaseInvoiceItemDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  unitId?: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  quantity!: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  unitPrice!: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  vatRate!: number;

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsOptional()
  discountRate?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreatePurchaseInvoiceDto {
  @ApiProperty()
  @IsString()
  supplierId!: string;

  @ApiProperty()
  @IsDateString()
  invoiceDate!: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty({ enum: ['PURCHASE', 'RETURN'], default: 'PURCHASE' })
  @IsString()
  @IsOptional()
  type?: PurchaseInvoiceType;

  @ApiProperty({ enum: ['DRAFT', 'CONFIRMED'], default: 'DRAFT' })
  @IsString()
  @IsOptional()
  status?: PurchaseInvoiceStatus;

  @ApiProperty()
  @IsString()
  warehouseId!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  einvoiceNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  internalNotes?: string;

  @ApiProperty({ type: [CreatePurchaseInvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseInvoiceItemDto)
  items!: CreatePurchaseInvoiceItemDto[];
}

export class UpdatePurchaseInvoiceDto {
  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  invoiceDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  einvoiceNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  internalNotes?: string;

  @ApiProperty({ type: [CreatePurchaseInvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseInvoiceItemDto)
  @IsOptional()
  items?: CreatePurchaseInvoiceItemDto[];
}

export class ListPurchaseInvoiceQueryDto {
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  pageSize?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  supplierId?: string;

  @ApiPropertyOptional({ enum: ['DRAFT', 'CONFIRMED', 'CANCELLED'] })
  @IsString()
  @IsOptional()
  status?: PurchaseInvoiceStatus;

  @ApiPropertyOptional({ enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID'] })
  @IsString()
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ enum: ['PURCHASE', 'RETURN'] })
  @IsString()
  @IsOptional()
  type?: PurchaseInvoiceType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  to?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  warehouseId?: string;
}