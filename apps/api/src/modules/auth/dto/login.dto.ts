import { ApiProperty } from '@nestjs/swagger';
import { LoginSchema, type LoginInput } from '@saas/shared';

export class LoginDto implements LoginInput {
  @ApiProperty({ example: 'admin@sistem.local', description: 'E-posta veya kullanıcı adı' })
  email!: string;

  @ApiProperty({ example: 'ChangeMe123!', description: 'Şifre' })
  password!: string;

  @ApiProperty({ required: false, description: 'Firma kodu (süper admin boş bırakabilir)' })
  tenantCode?: string;

  @ApiProperty({ required: false, default: false })
  remember?: boolean;
}

export { LoginSchema };
