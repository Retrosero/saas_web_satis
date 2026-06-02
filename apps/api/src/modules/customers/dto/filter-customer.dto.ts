import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { CustomerStatus, CustomerType } from '@saas/shared';

/**
 * Cari listeleme filtreleri.
 * Tüm alanlar opsiyonel — sadece sayfalama zorunlu.
 */
export class FilterCustomerDto {
  @ApiProperty({ required: false, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty({ required: false, default: 20, minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize: number = 20;

  @ApiProperty({ required: false, description: 'Cari kodu, adı, vergi no, telefon veya e-postada arar' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, enum: CustomerType })
  @IsOptional()
  @IsEnum(CustomerType)
  type?: CustomerType;

  @ApiProperty({ required: false, enum: CustomerStatus })
  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;
}
