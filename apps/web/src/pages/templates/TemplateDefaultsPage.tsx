import { useNavigate } from 'react-router-dom';
import { Settings, Save } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useTemplates } from '@/features/templates/api';
import { useState } from 'react';
import { useUpdateTemplate } from '@/features/templates/api';
import { DocumentTypeLabel, type DocumentType } from '@saas/shared';

const DOC_TYPES: DocumentType[] = ['SALE', 'ORDER', 'COLLECTION', 'RETURN', 'CASH', 'STATEMENT', 'STOCK_REPORT', 'SALES_REPORT', 'QUOTE'];

export function TemplateDefaultsPage() {
  const navigate = useNavigate();
  const { data: templates = [] } = useTemplates();
  return (
    <div className="space-y-4 max-w-3xl">
      <PageHeader title="Varsayılan Şablon Ayarları" description="Belge tipleri için varsayılan şablonları seçin" />
      <div className="rounded-lg border border-outline-variant bg-surface p-4 space-y-3">
        {DOC_TYPES.map((dt) => {
          const candidates = templates.filter((t) => t.documentType === dt && t.isActive);
          const current = candidates.find((t) => t.isDefault) ?? candidates[0];
          return (
            <div key={dt} className="flex items-center gap-3 border-b border-outline-variant pb-3 last:border-0">
              <div className="w-[200px] text-sm font-medium">{DocumentTypeLabel[dt]}</div>
              <select
                value={current?.id ?? ''}
                onChange={async (e) => {
                  if (!e.target.value) return;
                  const m = useUpdateTemplate(e.target.value);
                  await m.mutateAsync({ isDefault: true });
                }}
                className="flex-1 rounded-md border border-outline bg-surface px-3 py-2 text-sm"
              >
                <option value="">— Seçiniz —</option>
                {candidates.map((t) => <option key={t.id} value={t.id}>{t.name}{t.tenantId === null ? ' (Global)' : ''}</option>)}
              </select>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-on-surface-variant">Her belge tipi için bir varsayılan şablon seçin. PDF/yazdırma işlemlerinde otomatik kullanılır.</p>
    </div>
  );
}
