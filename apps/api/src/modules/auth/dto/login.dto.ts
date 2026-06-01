import { ApiProperty } from '@nestjs/swagger';
import { LoginSchema, type LoginInput } from '@saas/shared';
import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto implements LoginInput {
  @ApiProperty({ example: 'admin@sistem.local', description: 'E-posta veya kullanýcý adý' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'ChangeMe123!', description: 'Þifre' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ required: false, description: 'Firma kodu (süper admin boþ býrakabilir)' })
  @IsOptional()
  @IsString()
  tenantCode?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  remember?: boolean;
}

export { LoginSchema };
