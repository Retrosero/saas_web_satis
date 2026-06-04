import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { SaleStatus, SaleType } from '@saas/shared';

export class CreateSaleItemDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  unitId?: string;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @ApiProperty({ example: 100, description: 'Birim fiyat (KDV hariç)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @ApiProperty({ example: 20, description: 'KDV oranı (%)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vatRate!: number;

  @ApiProperty({ required: false, default: 0, description: 'Satır iskonto oranı (%)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  discountRate?: number = 0;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class CreateSaleDto {
  @ApiProperty()
  @IsString()
  customerId!: string;

  @ApiProperty({ example: '2026-06-01T10:00:00Z' })
  @IsDateString()
  saleDate!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ required: false, default: 'SALE', enum: SaleType })
  @IsOptional()
  @IsEnum(SaleType)
  type?: SaleType = SaleType.SALE;

  @ApiProperty({ required: false, default: 'DRAFT', enum: SaleStatus })
  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus = SaleStatus.DRAFT;

  @ApiProperty({ required: false, description: 'Hangi depodan çıkış olacak' })
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @ApiProperty({ required: false, default: 'TRY' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string = 'TRY';

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  exchangeRate?: number = 1;

  @ApiProperty({ type: [CreateSaleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items!: CreateSaleItemDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  internalNotes?: string;
}

import { Max as _Max } from 'class-validator';
