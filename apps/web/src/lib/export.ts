/**
 * Basit CSV export yardımcıları (frontend-only).
 * Backend'de /exports endpoint'i açmaya gerek yok — kullanıcı zaten tabloda filtreliyor.
 */

export function exportToCsv<T extends Record<string, unknown>>(
  rows: T[],
  filename: string,
  columns?: Array<{ key: keyof T | string; label: string }>,
) {
  if (rows.length === 0) {
    alert('Dışa aktarılacak kayıt yok');
    return;
  }
  const cols = columns ?? Object.keys(rows[0]).map((k) => ({ key: k, label: k }));
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const header = cols.map((c) => escape(c.label)).join(',');
  const body = rows
    .map((row) => cols.map((c) => escape(row[c.key as keyof T])).join(','))
    .join('\n');
  const csv = '\uFEFF' + header + '\n' + body; // BOM for UTF-8 in Excel
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
