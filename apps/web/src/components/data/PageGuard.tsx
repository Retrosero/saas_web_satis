import { AlertCircle, X } from 'lucide-react';
import type { ReactNode } from 'react';

export interface PageGuardProps {
  /** Sayfa açılabilir mi? (true ise çocukları renderla) */
  allowed: boolean;
  /** Yetkisiz durumda gösterilecek mesaj */
  title?: string;
  description?: string;
  /** Uyarı ikonu override */
  icon?: ReactNode;
  /** Geri butonu etiketi */
  backLabel?: string;
  /** Geri butonu callback'i */
  onBack?: () => void;
}

/**
 * Tenant/modül/yetki kontrolü için guard component.
 * allowed=false ise Türkçe uyarı gösterir.
 */
export function PageGuard({
  allowed, title = 'Yetkiniz yok', description, icon, backLabel = 'Geri Dön', onBack,
}: PageGuardProps) {
  if (allowed) return null;

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="card max-w-md p-8 text-center">
        <div className="inline-flex p-3 rounded-full bg-error-container text-error mb-4">
          {icon ?? <AlertCircle className="h-8 w-8" />}
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
        {description && (
          <p className="text-sm text-on-surface-variant mb-4">{description}</p>
        )}
        {onBack && (
          <button onClick={onBack} className="btn-primary">
            <X className="h-4 w-4" />
            {backLabel}
          </button>
        )}
      </div>
    </div>
  );
}