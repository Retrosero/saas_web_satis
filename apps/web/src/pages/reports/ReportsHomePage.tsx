import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, FileText, Layers, Star, Clock, Play, Trash2, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useReportPresets, useReportTemplates, useRunPreset, useToggleFavorite, useDeleteReportTemplate } from '@/features/reports/api';
import { formatDateTime, type PresetReport, type ReportTemplate } from '@saas/shared';

const PRESET_ICONS: Record<string, string> = {
  DAILY_SALES: '📅', MONTHLY_SALES: '📈', CUSTOMER_BALANCE: '👥', COLLECTION_REPORT: '💰',
  STOCK_REPORT: '📦', CRITICAL_STOCK: '⚠️', TOP_SELLING: '🏆', SALES_PERSON: '👤',
  BRAND_SALES: '🏷️', CATEGORY_SALES: '🗂️', WAREHOUSE_STOCK: '🏭', CASH_REPORT: '💵',
};

export function ReportsHomePage() {
  const navigate = useNavigate();
  const { data: presets = [], isLoading: pl } = useReportPresets();
  const { data: templates = [] } = useReportTemplates();
  const runMut = useRunPreset();
  const favMut = useToggleFavorite();
  const delMut = useDeleteReportTemplate();

  const favoriteTemplates = templates.filter((t) => t.isFavorite);
  const recentTemplates = templates.filter((t) => t.lastRunAt).slice(0, 5);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Gelişmiş Rapor Oluşturucu"
        description="Hazır raporlar, sürükle-bırak pivot tasarımcısı ve kayıtlı şablonlar"
        actions={
          <div className="flex gap-2">
            <button onClick={() => navigate('/reports/templates')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm">
              <FileText className="h-4 w-4" /> Kayıtlı Şablonlarım
            </button>
            <button onClick={() => navigate('/reports/scheduled')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm">
              <Clock className="h-4 w-4" /> Zamanlanmış
            </button>
            <button onClick={() => navigate('/reports/designer')} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary">
              <Layers className="h-4 w-4" /> Pivot Tasarımcısı
            </button>
          </div>
        }
      />

      {/* Kartlar */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div onClick={() => navigate('/reports/designer')} className="cursor-pointer rounded-lg border-2 border-primary bg-primary-container/30 p-4 hover:shadow-md transition">
          <Layers className="h-8 w-8 text-primary" />
          <h3 className="mt-2 font-semibold">Pivot Tasarımcısı</h3>
          <p className="text-xs text-on-surface-variant">Sürükle-bırak ile rapor oluştur</p>
        </div>
        <div onClick={() => navigate('/reports/templates')} className="cursor-pointer rounded-lg border border-outline-variant bg-surface p-4 hover:shadow-md transition">
          <FileText className="h-8 w-8 text-blue-600" />
          <h3 className="mt-2 font-semibold">Kayıtlı Raporlarım</h3>
          <p className="text-xs text-on-surface-variant">{templates.length} şablon</p>
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface p-4">
          <Star className="h-8 w-8 text-amber-500" />
          <h3 className="mt-2 font-semibold">Favori Raporlar</h3>
          <p className="text-xs text-on-surface-variant">{favoriteTemplates.length} favori</p>
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface p-4">
          <Clock className="h-8 w-8 text-green-600" />
          <h3 className="mt-2 font-semibold">Son Çalıştırılanlar</h3>
          <p className="text-xs text-on-surface-variant">{recentTemplates.length} rapor</p>
        </div>
      </div>

      {/* Hazır Raporlar */}
      <div className="rounded-lg border border-outline-variant bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold">Hazır Raporlar</h3>
        {pl ? <LoadingState /> : null}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {presets.map((p) => (
            <div key={p.code} className="flex items-center justify-between rounded-md border border-outline-variant p-3 hover:bg-surface-variant/50">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-2xl">{PRESET_ICONS[p.code] ?? '📊'}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{p.name}</p>
                  <p className="text-xs text-on-surface-variant truncate">{p.description}</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  const r = await runMut.mutateAsync(p.code);
                  if (r && !('error' in r)) navigate('/reports/result', { state: { result: r, title: p.name } });
                }}
                className="ml-2 flex-shrink-0 rounded-md bg-primary px-3 py-1 text-xs font-medium text-on-primary"
              >
                <Play className="inline h-3 w-3" /> Çalıştır
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Favori + Son */}
      {favoriteTemplates.length > 0 && (
        <div className="rounded-lg border border-outline-variant bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" /> Favori Raporlarım</h3>
          <ul className="space-y-1">
            {favoriteTemplates.map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded-md hover:bg-surface-variant/50 px-2 py-1.5">
                <button onClick={() => navigate('/reports/designer', { state: { template: t } })} className="text-left">
                  <p className="text-sm font-medium">{t.name}</p>
                  {t.description && <p className="text-xs text-on-surface-variant">{t.description}</p>}
                </button>
                <button onClick={() => favMut.mutate(t.id)} className="text-amber-500"><Star className="h-4 w-4 fill-current" /></button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {recentTemplates.length > 0 && (
        <div className="rounded-lg border border-outline-variant bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><Clock className="h-4 w-4 text-green-600" /> Son Çalıştırılanlar</h3>
          <ul className="space-y-1">
            {recentTemplates.map((t) => (
              <li key={t.id} className="flex items-center justify-between text-sm hover:bg-surface-variant/50 px-2 py-1.5 rounded-md">
                <span>{t.name}</span>
                <span className="text-xs text-on-surface-variant">{t.lastRunAt && formatDateTime(t.lastRunAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
