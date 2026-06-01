import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: Number(process.env.API_PORT ?? 3000),
  prefix: process.env.API_PREFIX ?? 'api/v1',
  corsOrigins: (process.env.API_CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  env: process.env.NODE_ENV ?? 'development',
  superAdmin: {
    email: process.env.SUPER_ADMIN_EMAIL ?? 'admin@sistem.local',
    password: process.env.SUPER_ADMIN_PASSWORD ?? 'ChangeMe123!',
    name: process.env.SUPER_ADMIN_NAME ?? 'Sistem Yöneticisi',
  },
}));

export type AppConfig = ReturnType<typeof appConfig>;
