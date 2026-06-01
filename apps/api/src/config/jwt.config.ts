import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  access: {
    secret: process.env.JWT_ACCESS_SECRET ?? 'change-me-access-secret-min-32-chars',
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  },
  refresh: {
    secret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh-secret-min-32-chars',
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 12),
}));

export type JwtConfig = ReturnType<typeof jwtConfig>;
