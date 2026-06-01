/**
 * Kullanıcı ile ilgili enumlar.
 */

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  LOCKED: 'LOCKED',
  PENDING: 'PENDING',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const DataScope = {
  OWN: 'OWN',
  BRANCH: 'BRANCH',
  TENANT: 'TENANT',
} as const;
export type DataScope = (typeof DataScope)[keyof typeof DataScope];

export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];
