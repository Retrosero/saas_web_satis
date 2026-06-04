import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { CashAccountType, CashAccountStatus, CashMovementType } from '@saas/shared';

export class CreateCashAccountDto {
  @IsString()
  @MaxLength(20)
  code!: string;

  @IsString()
  @MaxLength(100)
  name!: string;

  @IsEnum(CashAccountType)
  type!: CashAccountType;

  @IsOptional()
  @IsEnum(CashAccountStatus)
  status?: CashAccountStatus = CashAccountStatus.ACTIVE;

  @IsOptional()
  @IsString()
  currency?: string = 'TRY';

  @IsOptional()
  @IsString()
  @MaxLength(50)
  iban?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankBranch?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  accountHolder?: string;

  @IsOptional()
  isDefault?: boolean = false;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CreateCashMovementDto {
  @IsString()
  cashAccountId!: string;

  @IsEnum(CashMovementType)
  type!: CashMovementType;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  currency?: string = 'TRY';

  @IsOptional()
  @IsString()
  movementDate?: string;

  @IsOptional()
  @IsString()
  refType?: string;

  @IsOptional()
  @IsString()
  refId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  /** TRANSFER için: hedef hesap ID */
  @IsOptional()
  @IsString()
  transferToAccountId?: string;

  /** Kasa ödemesi için: müşteri/carı ID */
  @IsOptional()
  @IsString()
  customerId?: string;
}

export class UpdateCashAccountDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEnum(CashAccountStatus)
  status?: CashAccountStatus;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  iban?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankBranch?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  accountHolder?: string;

  @IsOptional()
  isDefault?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}