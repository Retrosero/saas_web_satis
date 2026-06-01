import { ApiProperty } from '@nestjs/swagger';
import { RefreshTokenSchema, type RefreshTokenInput } from '@saas/shared';

export class RefreshTokenDto implements RefreshTokenInput {
  @ApiProperty({ description: 'Yenileme anahtarı' })
  refreshToken!: string;
}

export { RefreshTokenSchema };
