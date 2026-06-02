import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

interface LoadingStateProps {
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingState({ label = 'Yükleniyor…', className, size = 'md' }: LoadingStateProps) {
  const sz = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-10 w-10' : 'h-6 w-6';
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-8 text-on-surface-variant',
        className,
      )}
    >
      <Loader2 className={cn('animate-spin', sz)} />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}
