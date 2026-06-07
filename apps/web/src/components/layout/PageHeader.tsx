import type { ReactNode } from 'react';


interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
}

export function PageHeader({ title, description, actions, breadcrumb }: PageHeaderProps) {
  const descriptionNode =
    typeof description === 'string' ? (
      <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
    ) : (
      <div className="mt-1 text-sm text-on-surface-variant">{description}</div>
    );

  return (
    <div className="flex flex-col gap-3 mb-6">
      {breadcrumb}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
          {description && descriptionNode}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
