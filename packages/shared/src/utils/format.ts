/**
 * Para formatla (Türkçe, TL).
 */
export function formatCurrency(
  value: number | string | null | undefined,
  currency: string = 'TRY',
  locale: string = 'tr-TR',
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value ?? 0;
  if (Number.isNaN(num)) return '—';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/** Sayı formatla (binlik nokta ile). */
export function formatNumber(value: number | string | null | undefined, locale: string = 'tr-TR'): string {
  const num = typeof value === 'string' ? parseFloat(value) : value ?? 0;
  if (Number.isNaN(num)) return '—';
  return new Intl.NumberFormat(locale).format(num);
}

/** Tarih formatla (GG.AA.YYYY). */
export function formatDate(value: string | Date | null | undefined, locale: string = 'tr-TR'): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/** Tarih + saat formatla. */
export function formatDateTime(value: string | Date | null | undefined, locale: string = 'tr-TR'): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/** Göreli tarih ("3 saat önce" gibi). */
export function formatRelative(value: string | Date | null | undefined, locale: string = 'tr-TR'): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const diff = d.getTime() - Date.now();
  const sec = Math.round(diff / 1000);
  if (Math.abs(sec) < 60) return rtf.format(sec, 'second');
  const min = Math.round(sec / 60);
  if (Math.abs(min) < 60) return rtf.format(min, 'minute');
  const hr = Math.round(min / 60);
  if (Math.abs(hr) < 24) return rtf.format(hr, 'hour');
  const day = Math.round(hr / 24);
  if (Math.abs(day) < 30) return rtf.format(day, 'day');
  const mon = Math.round(day / 30);
  if (Math.abs(mon) < 12) return rtf.format(mon, 'month');
  return rtf.format(Math.round(mon / 12), 'year');
}
