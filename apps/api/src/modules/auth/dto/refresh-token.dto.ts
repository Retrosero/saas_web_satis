import { ApiProperty } from '@nestjs/swagger';
import { RefreshTokenSchema, type RefreshTokenInput } from '@saas/shared';
import { IsString, MinLength } from 'class-validator';

export class RefreshTokenDto implements RefreshTokenInput {
  @ApiProperty({ description: 'Yenileme anahtar�' })
  @IsString()
  @MinLength(10)
  refreshToken!: string;
}

export { RefreshTokenSchema };
