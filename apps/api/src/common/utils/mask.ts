/**
 * Hassas alanları maskele. Audit log, API log ve error log'larda kullanılır.
 */
const DEFAULT_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'apiKey',
  'secret',
  'refreshToken',
  'accessToken',
];

export function maskSensitive<T extends Record<string, unknown>>(obj: T, extra: string[] = []): T {
  const fields = [...DEFAULT_FIELDS, ...extra];
  const result: Record<string, unknown> = { ...obj };
  for (const key of Object.keys(result)) {
    if (fields.includes(key) && result[key] !== null && result[key] !== undefined) {
      result[key] = '***';
    } else if (
      typeof result[key] === 'object' &&
      result[key] !== null &&
      !Array.isArray(result[key])
    ) {
      result[key] = maskSensitive(result[key] as Record<string, unknown>, extra);
    }
  }
  return result as T;
}
