import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title = 'Bir hata oluştu', message, onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12 px-6 text-center', className)}>
      <div className="rounded-full bg-error-container p-4 text-error">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {message && <p className="text-sm text-on-surface-variant max-w-md">{message}</p>}
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-2">
          Yeniden Dene
        </button>
      )}
    </div>
  );
}
