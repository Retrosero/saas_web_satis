import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface DataTableColumn<T = unknown> {
  key: string;
  label: string;
  /** Column genişliği (CSS sınıfı veya değer) */
  width?: string;
  /** Özel render fonksiyonu */
  render?: (row: T) => ReactNode;
  /** Bu kolona göre sıralama yapılabilir mi? */
  sortable?: boolean;
  /** Hücre hizalama */
  align?: 'left' | 'center' | 'right';
  /** Mobilde gizle (MobileCardList'te gösterilir) */
  hideOnMobile?: boolean;
}

export interface DataTableProps<T = unknown> {
  columns: DataTableColumn<T>[];
  data: T[];
  /** Toplam satır sayısı (sunucu tarafı sayfalama için) */
  total?: number;
  /** Sayfa başına satır sayısı */
  pageSize?: number;
  /** Mevcut sayfa (1-indexed) */
  page?: number;
  /** Sayfa değişimi */
  onPageChange?: (page: number) => void;
  /** Satır tıklama olayı */
  onRowClick?: (row: T) => void;
  /** Üstteki arama alanı */
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  /** Yükleniyor durumu */
  loading?: boolean;
  /** Boş durum mesajı */
  emptyMessage?: string;
  /** Toplam satır sayısı etiketi */
  totalLabel?: string;
  /** Üst kısım eylemleri (filtreler, butonlar vs.) */
  toolbar?: ReactNode;
  /** Satır anahtarı (React için) */
  rowKey: (row: T) => string;
}

export function DataTable<T = unknown>({
  columns, data, total, pageSize = 20, page = 1, onPageChange,
  onRowClick, search, loading, emptyMessage = 'Veri bulunamadı',
  totalLabel = 'kayıt', toolbar, rowKey,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Client-side sort
  const sortedData = sortKey
    ? [...data].sort((a, b) => {
        const av = (a as any)[sortKey];
        const bv = (b as any)[sortKey];
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv), 'tr-TR');
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : data;

  const totalPages = total ? Math.ceil(total / pageSize) : Math.ceil(data.length / pageSize);
  const showPagination = totalPages > 1;

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total ?? data.length);

  return (
    <div className="card overflow-hidden">
      {/* Toolbar */}
      {(search || toolbar) && (
        <div className="px-4 py-3 border-b border-outline-variant bg-surface-container flex flex-col sm:flex-row gap-2">
          {search && (
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
              <input
                type="search"
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                placeholder={search.placeholder ?? 'Ara…'}
                className="w-full h-10 pl-10 pr-10 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
              />
              {search.value && (
                <button
                  onClick={() => search.onChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
          {toolbar && <div className="flex items-center gap-2 flex-wrap">{toolbar}</div>}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-container border-b border-outline-variant">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    'px-4 py-3 font-semibold text-foreground',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    col.hideOnMobile && 'hidden md:table-cell',
                    col.sortable && 'cursor-pointer select-none hover:bg-surface-high',
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      sortKey === col.key
                        ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)
                        : <ChevronDown className="h-3 w-3 opacity-30" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-on-surface-variant">
                  Yükleniyor…
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-on-surface-variant">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-outline-variant last:border-0',
                    onRowClick && 'cursor-pointer hover:bg-surface-container',
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3',
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                        col.hideOnMobile && 'hidden md:table-cell',
                      )}
                    >
                      {col.render ? col.render(row) : ((row as any)[col.key] as ReactNode) ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="px-4 py-3 border-t border-outline-variant bg-surface-container flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
          <span className="text-on-surface-variant">
            {total ? `${startIndex}–${endIndex} / ${total} ${totalLabel}` : `${data.length} ${totalLabel}`}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => onPageChange?.(page - 1)}
              className="h-8 w-8 rounded flex items-center justify-center hover:bg-surface disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-foreground font-mono text-xs">
              {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => onPageChange?.(page + 1)}
              className="h-8 w-8 rounded flex items-center justify-center hover:bg-surface disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}