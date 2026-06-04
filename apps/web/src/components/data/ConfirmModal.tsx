import type { ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  /** Uyarı seviyesi: 'danger' = kırmızı onay butonu, 'info' = birincil renk */
  variant?: 'danger' | 'info' | 'warning';
  /** Yükleniyor durumu (onay butonu disable + spinner) */
  loading?: boolean;
}

export function ConfirmModal({
  open, onClose, onConfirm, title, description,
  confirmText = 'Onayla', cancelText = 'İptal',
  variant = 'danger', loading = false,
}: ConfirmModalProps) {
  if (!open) return null;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="card max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className={cn(
              'p-2 rounded-full flex-shrink-0',
              variant === 'danger' && 'bg-error-container text-error',
              variant === 'warning' && 'bg-tertiary-container text-tertiary',
              variant === 'info' && 'bg-primary-container text-primary',
            )}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            {description && (
              <div className="text-sm text-on-surface-variant mt-1">{description}</div>
            )}
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-foreground hover:bg-surface-container rounded-md disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              'px-4 py-2 text-sm font-semibold rounded-md disabled:opacity-50',
              variant === 'danger' && 'bg-error text-on-error hover:bg-error-hover',
              variant === 'warning' && 'bg-tertiary text-on-tertiary hover:bg-tertiary-hover',
              variant === 'info' && 'bg-primary text-on-primary hover:bg-primary-hover',
            )}
          >
            {loading ? 'İşleniyor…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}