import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export function ForbiddenPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="rounded-full bg-error-container p-6 text-error">
        <ShieldAlert className="h-12 w-12" />
      </div>
      <h1 className="text-3xl font-bold text-foreground">403 — Erişim Engellendi</h1>
      <p className="text-sm text-on-surface-variant max-w-md">
        Bu sayfaya erişim yetkiniz bulunmuyor. Lütfen firma yöneticinizle iletişime geçin.
      </p>
      <Link to="/dashboard" className="btn-primary mt-2">
        Panele Dön
      </Link>
    </div>
  );
}
