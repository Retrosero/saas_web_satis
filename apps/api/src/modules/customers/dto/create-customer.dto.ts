import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CustomerStatus, CustomerType } from '@saas/shared';

/**
 * Yeni cari oluşturma.
 * code opsiyonel — boş bırakılırsa backend tenant-scoped sıradaki kodu üretir (M-0001, T-0001, ...).
 */
export class CreateCustomerDto {
  @ApiProperty({ required: false, description: 'Boş bırakılırsa otomatik üretilir (M-0001 vb.)' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  code?: string;

  @ApiProperty({ example: 'Yıldız Tekstil A.Ş.' })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ required: false, default: CustomerType.CUSTOMER, enum: CustomerType })
  @IsOptional()
  @IsEnum(CustomerType)
  type?: CustomerType = CustomerType.CUSTOMER;

  @ApiProperty({ required: false, example: 'Ahmet Yıldız' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  contactName?: string;

  @ApiProperty({ required: false, example: '1234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  taxNumber?: string;

  @ApiProperty({ required: false, example: 'Beşiktaş' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  taxOffice?: string;

  @ApiProperty({ required: false, example: '12345678901' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  identityNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiProperty({ required: false, default: 'Türkiye' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone2?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(34)
  iban?: string;

  @ApiProperty({ required: false, default: 0, description: 'Açılış bakiyesi (pozitif: alacak, negatif: borç)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  openingBalance?: number = 0;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  creditLimit?: number = 0;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(365)
  paymentTermDays?: number = 0;

  @ApiProperty({ required: false, default: CustomerStatus.ACTIVE, enum: CustomerStatus })
  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus = CustomerStatus.ACTIVE;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
