import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface MobileCardListProps<T> {
  data: T[];
  onItemClick?: (item: T) => void;
  /** Üst satır (başlık + meta) */
  header: (item: T) => ReactNode;
  /** İkincil satır (alt başlık) */
  subtitle?: (item: T) => ReactNode;
  /** Sağ taraf rozet/içerik */
  rightBadge?: (item: T) => ReactNode;
  /** Alt satır (meta bilgiler) */
  footer?: (item: T) => ReactNode;
  /** Anahtar fonksiyonu */
  keyFn: (item: T) => string;
  /** Boş durum mesajı */
  emptyMessage?: string;
}

/**
 * Mobil/tablet için kart listesi görünümü.
 * DataTable yerine bu kullanılır (md:hidden).
 */
export function MobileCardList<T>({
  data, onItemClick, header, subtitle, rightBadge, footer, keyFn, emptyMessage = 'Veri bulunamadı',
}: MobileCardListProps<T>) {
  if (data.length === 0) {
    return (
      <div className="card p-12 text-center text-sm text-on-surface-variant">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="md:hidden card overflow-hidden divide-y divide-outline-variant">
      {data.map((item) => (
        <button
          key={keyFn(item)}
          onClick={onItemClick ? () => onItemClick(item) : undefined}
          className={cn(
            'w-full text-left p-3 flex items-center gap-3 hover:bg-surface-container transition-colors',
            onItemClick && 'cursor-pointer',
          )}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground truncate">{header(item)}</span>
            </div>
            {subtitle && <div className="text-xs text-on-surface-variant truncate mt-0.5">{subtitle(item)}</div>}
            {footer && <div className="text-xs text-on-surface-variant mt-1">{footer(item)}</div>}
          </div>
          {rightBadge && <div className="flex-shrink-0">{rightBadge(item)}</div>}
          {onItemClick && <ChevronRight className="h-4 w-4 text-on-surface-variant flex-shrink-0" />}
        </button>
      ))}
    </div>
  );
}