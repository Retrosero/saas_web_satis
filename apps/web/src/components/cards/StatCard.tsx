import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/cn';

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: { value: number; direction: 'up' | 'down' };
  icon?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, hint, trend, icon, className }: StatCardProps) {
  return (
    <div className={cn('card flex flex-col gap-3 p-4', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-on-surface-variant">{label}</p>
        </div>
        {icon && (
          <div className="rounded-md bg-primary-container/40 p-2 text-primary">{icon}</div>
        )}
      </div>
      <div className="font-numeric text-2xl font-bold text-foreground">{value}</div>
      <div className="flex items-center gap-2 text-xs">
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-semibold',
              trend.direction === 'up'
                ? 'bg-secondary-container/40 text-secondary'
                : 'bg-error-container text-error',
            )}
          >
            {trend.direction === 'up' ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.value > 0 ? '+' : ''}
            {trend.value}%
          </span>
        )}
        {hint && <span className="text-on-surface-variant">{hint}</span>}
      </div>
    </div>
  );
}
