import { ApiProperty } from '@nestjs/swagger';
import { LoginSchema, type LoginInput } from '@saas/shared';
import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto implements LoginInput {
  @ApiProperty({ example: 'admin@sistem.local', description: 'E-posta veya kullan�c� ad�' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'ChangeMe123!', description: '�ifre' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ required: false, description: 'Firma kodu (s�per admin bo� b�rakabilir)' })
  @IsOptional()
  @IsString()
  tenantCode?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  remember?: boolean;
}

export { LoginSchema };
