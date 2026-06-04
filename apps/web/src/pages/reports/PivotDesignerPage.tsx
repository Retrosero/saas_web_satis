import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layers, Play, Save, Star, Plus, X, ArrowLeft, Download } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { useExecuteReport, useCreateReportTemplate, useUpdateReportTemplate } from '@/features/reports/api';
import { REPORT_FIELDS, AggregateTypeLabel, ChartTypeLabel, type AggregateType, type ChartType, type PivotConfig, type ReportField, type ReportResult, type ReportTemplate } from '@saas/shared';

const FIELDS_BY_CATEGORY = REPORT_FIELDS.reduce((acc, f) => {
  if (!acc[f.category]) acc[f.category] = [];
  acc[f.category].push(f);
  return acc;
}, {} as Record<string, ReportField[]>);

export function PivotDesignerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initial = (location.state as any)?.template as ReportTemplate | undefined;

  const [config, setConfig] = useState<PivotConfig>(initial?.config ?? { rows: [], columns: [], values: [], filters: [] });
  const [chartType, setChartType] = useState<ChartType>(initial?.chartType ?? 'TABLE');
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [isFavorite, setIsFavorite] = useState(initial?.isFavorite ?? false);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [draggedField, setDraggedField] = useState<ReportField | null>(null);
  const [dropZone, setDropZone] = useState<'rows' | 'columns' | 'values' | 'filters' | null>(null);

  const executeMut = useExecuteReport();
  const createMut = useCreateReportTemplate();
  const updateMut = useUpdateReportTemplate(initial?.id ?? '');

  const allFields = REPORT_FIELDS;

  const addValue = (field: string, aggregate: AggregateType) => {
    setConfig({ ...config, values: [...config.values, { field, aggregate, alias: `${field.split('.').pop()}_${aggregate.toLowerCase()}` }] });
  };

  const addFilter = (field: string) => {
    setConfig({ ...config, filters: [...config.filters, { field, operator: '=', value: '' }] });
  };

  const onDrop = () => {
    if (!draggedField || !dropZone) return;
    if (dropZone === 'rows' || dropZone === 'columns') {
      if (draggedField.groupable && !config[dropZone].includes(draggedField.field)) {
        setConfig({ ...config, [dropZone]: [...config[dropZone], draggedField.field] });
      }
    } else if (dropZone === 'values') {
      if (draggedField.aggregatable) {
        addValue(draggedField.field, draggedField.numeric ? 'SUM' : 'COUNT');
      }
    } else if (dropZone === 'filters') {
      if (draggedField.groupable) addFilter(draggedField.field);
    }
    setDraggedField(null);
    setDropZone(null);
  };

  useEffect(() => {
    if (dropZone) onDrop();
  }, [dropZone]);

  const run = async () => {
    const r = await executeMut.mutateAsync(config);
    setResult(r);
  };

  const save = async () => {
    if (!name) { alert('Önce şablon adı girin'); return; }
    if (initial) {
      await updateMut.mutateAsync({ name, description, config, chartType, isFavorite });
    } else {
      await createMut.mutateAsync({ name, description, config, chartType, isFavorite });
    }
    navigate('/reports/templates');
  };

  const resultCols: DataTableColumn<any>[] = useMemo(() => {
    if (!result) return [];
    return result.columns.map((c) => ({
      key: c.key, label: c.label,
      align: c.type === 'number' ? 'right' : 'left',
      render: (r) => c.type === 'number' ? Number(r[c.key] ?? 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 }) : (r[c.key] ?? '—'),
    }));
  }, [result]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pivot Rapor Tasarımcısı"
        description="Sürükle-bırak ile satır/sütun/değer/filtre alanlarını seçin"
        actions={
          <div className="flex gap-2">
            <button onClick={() => navigate('/reports')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><ArrowLeft className="h-4 w-4" /> Geri</button>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Şablon adı..." className="rounded-md border border-outline bg-surface px-3 py-2 text-sm w-[200px]" />
            <button onClick={save} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Save className="h-4 w-4" /> Kaydet</button>
            <button onClick={run} disabled={config.values.length === 0 || executeMut.isPending} className="flex items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"><Play className="h-4 w-4" /> Çalıştır</button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Sol: Alanlar paneli */}
        <div className="lg:col-span-3 rounded-lg border border-outline-variant bg-surface p-3">
          <h3 className="mb-2 text-sm font-semibold">Alanlar</h3>
          <p className="mb-3 text-xs text-on-surface-variant">Sürükleyip hedef bölüme bırakın</p>
          <div className="space-y-3">
            {Object.entries(FIELDS_BY_CATEGORY).map(([cat, fields]) => (
              <div key={cat}>
                <p className="text-xs font-semibold text-on-surface-variant mb-1">{cat}</p>
                {fields.map((f) => (
                  <div
                    key={f.field}
                    draggable
                    onDragStart={() => setDraggedField(f)}
                    onDragEnd={() => setDraggedField(null)}
                    className="mb-1 cursor-grab rounded-md border border-outline-variant bg-surface px-2 py-1.5 text-xs hover:bg-surface-variant"
                  >
                    <code className="text-[10px]">{f.field}</code>
                    <div className="font-medium">{f.label}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Sağ: 4 hedef bölge + sonuç */}
        <div className="lg:col-span-9 space-y-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {(['rows', 'columns', 'values', 'filters'] as const).map((zone) => (
              <div
                key={zone}
                onDragOver={(e) => { e.preventDefault(); setDropZone(zone); }}
                onDragLeave={() => setDropZone(null)}
                className={`rounded-lg border-2 border-dashed p-3 min-h-[120px] ${dropZone === zone ? 'border-primary bg-primary-container/20' : 'border-outline-variant'}`}
              >
                <p className="text-xs font-semibold text-on-surface-variant mb-2">
                  {zone === 'rows' ? 'Satır Alanları' : zone === 'columns' ? 'Sütun Alanları' : zone === 'values' ? 'Değer Alanları' : 'Filtre Alanları'}
                </p>
                {zone === 'values' ? (
                  <div className="space-y-1">
                    {config.values.map((v, i) => (
                      <div key={i} className="flex items-center gap-1 rounded-md bg-primary-container/30 px-2 py-1 text-xs">
                        <span className="flex-1 truncate"><code>{v.field}</code></span>
                        <select value={v.aggregate} onChange={(e) => { const nv = [...config.values]; nv[i] = { ...v, aggregate: e.target.value as AggregateType }; setConfig({ ...config, values: nv }); }} className="rounded border border-outline bg-surface px-1 text-[10px]">
                          {Object.entries(AggregateTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                        <button onClick={() => setConfig({ ...config, values: config.values.filter((_, j) => j !== i) })} className="text-red-600"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                ) : zone === 'filters' ? (
                  <div className="space-y-1">
                    {config.filters.map((f, i) => (
                      <div key={i} className="flex items-center gap-1 rounded-md bg-amber-100/30 px-2 py-1 text-xs">
                        <code className="flex-1 truncate">{f.field}</code>
                        <select value={f.operator} onChange={(e) => { const nf = [...config.filters]; nf[i] = { ...f, operator: e.target.value as any }; setConfig({ ...config, filters: nf }); }} className="rounded border border-outline bg-surface px-1 text-[10px]">
                          <option>=</option><option>!=</option><option>{'>'}</option><option>{'<'}</option>
                        </select>
                        <input value={String(f.value ?? '')} onChange={(e) => { const nf = [...config.filters]; nf[i] = { ...f, value: e.target.value }; setConfig({ ...config, filters: nf }); }} className="w-20 rounded border border-outline bg-surface px-1 text-[10px]" />
                        <button onClick={() => setConfig({ ...config, filters: config.filters.filter((_, j) => j !== i) })} className="text-red-600"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {config[zone].map((f, i) => (
                      <div key={i} className="flex items-center gap-1 rounded-md bg-primary-container/30 px-2 py-1 text-xs">
                        <code className="flex-1 truncate">{f}</code>
                        <button onClick={() => setConfig({ ...config, [zone]: config[zone].filter((_, j) => j !== i) })} className="text-red-600"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
                {((zone === 'rows' || zone === 'columns') && config[zone].length === 0) || (zone === 'values' && config.values.length === 0) || (zone === 'filters' && config.filters.length === 0) ? (
                  <p className="text-[10px] text-on-surface-variant text-center mt-4">Alan sürükleyin</p>
                ) : null}
              </div>
            ))}
          </div>

          {/* Sonuç */}
          {result ? (
            <div className="rounded-lg border border-outline-variant bg-surface">
              <div className="flex items-center justify-between border-b border-outline-variant p-3">
                <p className="text-sm font-semibold">Sonuç ({result.rowCount} satır, {result.duration}ms)</p>
                <button onClick={() => {
                  if (!result) return;
                  const csv = [result.columns.map((c) => c.label).join(','), ...result.rows.map((r) => result.columns.map((c) => r[c.key] ?? '').join(','))].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
                  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'rapor.csv'; a.click();
                }} className="flex items-center gap-1 text-xs text-primary"><Download className="h-3 w-3" /> CSV</button>
              </div>
              <div className="max-h-[500px] overflow-auto">
                <DataTable columns={resultCols} data={result.rows} rowKey={(r: any) => String((r as any).__idx ?? Math.random())} />
              </div>
              {Object.keys(result.totals).length > 0 && (
                <div className="border-t border-outline-variant bg-surface-variant/30 p-3 text-sm">
                  <p className="font-semibold mb-1">Toplamlar</p>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(result.totals).map(([k, v]) => (
                      <span key={k}><strong>{k}:</strong> {Number(v).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : executeMut.isPending ? <LoadingState /> : null}
        </div>
      </div>
    </div>
  );
}
