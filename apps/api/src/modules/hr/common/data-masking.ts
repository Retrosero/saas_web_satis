/**
 * HR Hassas Veri Maskeleme
 * TC Kimlik ve IBAN gibi alanlar için default maskeleme.
 * Backend'de response'a yansımadan önce maskelenir.
 * Frontend full açma istemezse hiçbir zaman full değer dönmez.
 */

export function maskIdentityNumber(tc: string | null | undefined): string | null | undefined {
  if (!tc) return tc as null;
  const cleaned = String(tc).replace(/\D/g, '');
  if (cleaned.length !== 11) return '***';
  return `${cleaned.slice(0, 2)}*******${cleaned.slice(9, 11)}`;
  // örn: 12*******89
}

export function maskIban(iban: string | null | undefined): string | null | undefined {
  if (!iban) return iban as null;
  const cleaned = String(iban).replace(/\s/g, '').toUpperCase();
  if (cleaned.length < 8) return '****';
  return `${cleaned.slice(0, 4)} **** **** ${cleaned.slice(-4)}`;
  // örn: TR12 **** **** 7890
}

export function maskPhone(phone: string | null | undefined): string | null | undefined {
  if (!phone) return phone as null;
  const cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.length < 6) return '***';
  // örn: 0532***1234
  return `${cleaned.slice(0, 4)}***${cleaned.slice(-4)}`;
}

export function maskEmail(email: string | null | undefined): string | null | undefined {
  if (!email) return email as null;
  const at = email.indexOf('@');
  if (at < 2) return '***';
  return `${email[0]}***${email.slice(at)}`;
  // örn: a***@firma.com
}

/**
 * TC Kimlik No algoritmik doğrulama (Türkiye).
 * 11 hane, son 2 hane çift olmalı, 10. hane tek.
 */
export function isValidIdentityNumber(tc: string): boolean {
  if (!/^\d{11}$/.test(tc)) return false;
  if (tc[0] === '0') return false;
  const digits = tc.split('').map(Number);
  // 1,3,5,7,9 toplamı
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  // 2,4,6,8 toplamı
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const tenth = (oddSum * 7 - evenSum) % 10;
  if (tenth !== digits[9]) return false;
  const total = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  return total % 10 === digits[10];
}

/**
 * IBAN doğrulama (TR).
 * TR + 24 hane.
 */
export function isValidIban(iban: string): boolean {
  const cleaned = iban.replace(/\s/g, '').toUpperCase();
  if (!/^TR\d{24}$/.test(cleaned)) return false;
  // Türkiye için basit format kontrolü
  return true;
}
