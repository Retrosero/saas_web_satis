import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="rounded-full bg-surface-container p-6 text-on-surface-variant">
        <FileQuestion className="h-12 w-12" />
      </div>
      <h1 className="text-3xl font-bold text-foreground">404 — Sayfa Bulunamadı</h1>
      <p className="text-sm text-on-surface-variant max-w-md">
        Aradığınız sayfa kaldırılmış, adı değiştirilmiş veya hiç var olmamış olabilir.
      </p>
      <Link to="/dashboard" className="btn-primary mt-2">
        Panele Dön
      </Link>
    </div>
  );
}
