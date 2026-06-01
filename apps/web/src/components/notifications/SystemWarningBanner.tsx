import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/cn';

interface SystemWarningBannerProps {
  title: string;
  message?: string;
  variant?: 'warning' | 'info' | 'error';
  dismissible?: boolean;
  className?: string;
}

export function SystemWarningBanner({
  title,
  message,
  variant = 'warning',
  dismissible = true,
  className,
}: SystemWarningBannerProps) {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  const colors = {
    warning: 'border-tertiary text-foreground',
    info: 'border-primary text-foreground',
    error: 'border-error text-foreground',
  } as const;

  return (
    <div className={cn('flex items-start gap-3 rounded-md border p-3', colors[variant], className)}>
      <AlertTriangle
        className={cn(
          'h-5 w-5 flex-shrink-0 mt-0.5',
          variant === 'error' ? 'text-error' : variant === 'warning' ? 'text-tertiary' : 'text-primary',
        )}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        {message && <p className="mt-1 text-sm text-on-surface-variant">{message}</p>}
      </div>
      {dismissible && (
        <button
          onClick={() => setOpen(false)}
          className="text-on-surface-variant hover:text-foreground"
          aria-label="Kapat"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
