import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';
import { StockMovementRefType, StockMovementType } from '@saas/shared';

export class CreateStockMovementDto {
  @ApiProperty({ example: 'clxyz123...' })
  @IsString()
  productId!: string;

  @ApiProperty({ example: 'clxyz123...' })
  @IsString()
  warehouseId!: string;

  @ApiProperty({ enum: StockMovementType, description: 'IN | OUT | TRANSFER | ADJUST' })
  @IsEnum(StockMovementType)
  type!: StockMovementType;

  @ApiProperty({ example: 10, description: 'Pozitif miktar' })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantity!: number;

  @ApiProperty({ required: false, description: 'Birim maliyet (opsiyonel, maliyet raporları için)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @ApiProperty({ example: '2026-06-01T10:00:00Z' })
  @IsDateString()
  movementDate!: string;

  @ApiProperty({ enum: StockMovementRefType, description: 'SALE | PURCHASE | TRANSFER | ADJUST | COUNT | ...' })
  @IsEnum(StockMovementRefType)
  refType!: StockMovementRefType;

  @ApiProperty({ required: false, description: 'TRANSFER için hedef depo' })
  @IsOptional()
  @IsString()
  transferToWarehouseId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  refNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class StockTransferDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty()
  @IsString()
  fromWarehouseId!: string;

  @ApiProperty()
  @IsString()
  toWarehouseId!: string;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantity!: number;

  @ApiProperty({ example: '2026-06-01T10:00:00Z' })
  @IsDateString()
  movementDate!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  refNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class StockAdjustDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty()
  @IsString()
  warehouseId!: string;

  @ApiProperty({ description: 'Pozitif: stok artışı, negatif: stok azalışı (count farkı)' })
  @Type(() => Number)
  @IsNumber()
  quantity!: number;

  @ApiProperty({ example: '2026-06-01T10:00:00Z' })
  @IsDateString()
  movementDate!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  refNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class FilterStockMovementDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  page: number = 1;

  @ApiProperty({ required: false, default: 50, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  pageSize: number = 50;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @ApiProperty({ required: false, enum: StockMovementType })
  @IsOptional()
  @IsEnum(StockMovementType)
  type?: StockMovementType;

  @ApiProperty({ required: false, enum: StockMovementRefType })
  @IsOptional()
  @IsEnum(StockMovementRefType)
  refType?: StockMovementRefType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  to?: string;
}
