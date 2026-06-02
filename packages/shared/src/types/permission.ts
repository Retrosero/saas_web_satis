import type { ModuleCode } from '../enums/module.enum.js';
import type { PermissionAction } from '../enums/permission.enum.js';

export interface Permission {
  id: string;
  code: string;
  module: ModuleCode;
  resource: string;
  action: PermissionAction;
  description: string | null;
}

/** JWT access token payload. */
export interface JwtPayload {
  sub: string; // user id
  tid: string; // tenant id (süper admin için "SYSTEM")
  role: string; // birincil rol kodu
  perms: string[]; // izin kodları
  mods: string[]; // aktif modül kodları
  iat?: number;
  exp?: number;
}

/** Refresh token payload. */
export interface RefreshTokenPayload {
  sub: string;
  tid: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}
