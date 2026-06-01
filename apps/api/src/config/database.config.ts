import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL ?? 'postgresql://saas:saas@localhost:5432/saas_dev?schema=public',
  logging: process.env.DATABASE_LOGGING === 'true',
}));

export type DatabaseConfig = ReturnType<typeof databaseConfig>;
