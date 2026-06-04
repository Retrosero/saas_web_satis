import { useState } from 'react';
import { Plus, Settings } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { usePayrollParams, useUpsertPayrollParam, useSeedPayrollParams } from '@/features/hr/api';

interface ParamRow {
  id: string;
  year: number;
  paramKey: string;
  paramValue: string | number;
  description: string | null;
}

export function PayrollParamsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const { data, isLoading } = usePayrollParams(year);
  const upsertMut = useUpsertPayrollParam();
  const seedMut = useSeedPayrollParams();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ParamRow | null>(null);
  const [form, setForm] = useState({ paramKey: '', paramValue: '', description: '' });

  const rows: ParamRow[] = (data as any[]) ?? [];

  const columns: DataTableColumn<ParamRow>[] = [
    {
      key: 'paramKey',
      label: 'Parametre',
      render: (r) => <code className="rounded bg-bg-subtle px-2 py-0.5 text-sm font-mono">{r.paramKey}</code>,
    },
    {
      key: 'paramValue',
      label: 'Değer',
      render: (r) => <span className="font-semibold">{typeof r.paramValue === 'number' ? r.paramValue.toLocaleString('tr-TR') : r.paramValue}</span>,
    },
    {
      key: 'description',
      label: 'Açıklama',
      render: (r) => <span className="text-sm text-fg-muted">{r.description ?? '—'}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Bordro Parametreleri"
        description="SGK oranları, vergi dilimleri, asgari ücret"
        actions={
          <div className="flex gap-2">
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-md border border-outline bg-surface px-3 py-2 text-sm">
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button onClick={() => seedMut.mutate(year)} disabled={seedMut.isPending} className="flex items-center gap-1 rounded-md border border-outline bg-surface px-3 py-2 text-sm hover:bg-bg-subtle disabled:opacity-50">
              <Settings className="h-4 w-4" /> Varsayılanları Yükle
            </button>
          </div>
        }
      />

      {isLoading ? <LoadingState /> : (
        <div className="hidden md:block">
          <DataTable
            columns={columns}
            data={rows}
            rowKey={(r) => r.id}
            onRowClick={(r) => { setEditing(r); setForm({ paramKey: r.paramKey, paramValue: String(r.paramValue), description: r.description ?? '' }); setShowForm(true); }}
          />
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-lg bg-surface p-4 shadow-lg">
            <h3 className="mb-3 font-semibold">{editing ? 'Parametre Güncelle' : 'Yeni Parametre'}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs">Parametre Anahtarı</label>
                <input value={form.paramKey} onChange={(e) => setForm({ ...form, paramKey: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm font-mono" placeholder="min_wage" />
              </div>
              <div>
                <label className="text-xs">Değer</label>
                <input type="number" value={form.paramValue} onChange={(e) => setForm({ ...form, paramValue: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs">Açıklama</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm" />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="rounded-md border border-outline bg-surface px-3 py-1.5 text-sm hover:bg-bg-subtle">İptal</button>
              <button
                onClick={async () => {
                  await upsertMut.mutateAsync({ year, paramKey: form.paramKey, paramValue: Number(form.paramValue), description: form.description || undefined });
                  setShowForm(false);
                }}
                disabled={!form.paramKey || !form.paramValue}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:opacity-50"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}