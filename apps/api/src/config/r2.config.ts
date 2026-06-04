import { registerAs } from '@nestjs/config';

export const r2Config = registerAs('r2', () => ({
  driver: process.env.STORAGE_DRIVER ?? 'local',
  local: {
    path: process.env.STORAGE_LOCAL_PATH ?? './storage',
  },
  r2: {
    accountId: process.env.STORAGE_R2_ACCOUNT_ID ?? '',
    accessKeyId: process.env.STORAGE_R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.STORAGE_R2_SECRET_ACCESS_KEY ?? '',
    bucket: process.env.STORAGE_R2_BUCKET ?? 'saas-files',
    publicUrl: process.env.STORAGE_R2_PUBLIC_URL ?? '',
  },
}));

export type R2Config = ReturnType<typeof r2Config>;
