import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CollectionStatus, CollectionType } from '@saas/shared';

export class CreateCollectionDto {
  @IsString()
  customerId!: string;

  @IsDateString()
  collectionDate!: string;

  @IsEnum(CollectionType)
  type?: CollectionType = CollectionType.CASH;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  linkedSaleId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  internalNotes?: string;
}
