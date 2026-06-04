import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, Trash2, Send, Check, X, Eye, FileDown } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { MobileCardList } from '@/components/data/MobileCardList';
import { useQuotes, useUpdateQuoteStatus, useDeleteQuote, useConvertQuoteToOrder, useConvertQuoteToSale } from '@/features/quotes/api';
import { QuoteStatus, QuoteStatusLabel, QuoteStatusColor } from '@saas/shared';
import { formatDate } from '@saas/shared';

const COLOR_BG: Record<string, string> = { blue: 'bg-blue-100 text-blue-800', green: 'bg-green-100 text-green-800', red: 'bg-red-100 text-red-800', amber: 'bg-amber-100 text-amber-800', gray: 'bg-gray-200 text-gray-700' };

export function QuotesListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmConvert, setConfirmConvert] = useState<{ id: string; type: 'ORDER' | 'SALE' } | null>(null);
  const { data, isLoading } = useQuotes({ page, status: status as any || undefined });
  const updateStatus = useUpdateQuoteStatus('*');
  const delMut = useDeleteQuote();
  const toOrder = useConvertQuoteToOrder('*');
  const toSale = useConvertQuoteToSale('*');

  const columns: DataTableColumn<any>[] = [
    { key: 'no', label: 'Teklif No', render: (q) => <span className="font-mono text-xs">{q.quoteNumber}</span> },
    { key: 'customer', label: 'Müşteri', render: (q) => <div><p className="font-medium">{q.customerName}</p><p className="text-xs text-on-surface-variant">{formatDate(q.quoteDate)}</p></div> },
    { key: 'valid', label: 'Geçerlilik', hideOnMobile: true, render: (q) => <span className={q.validUntil < new Date() ? 'text-red-600' : ''}>{formatDate(q.validUntil)}</span> },
    { key: 'total', label: 'Tutar', align: 'right', render: (q) => <span className="font-semibold">{Number(q.grandTotal).toLocaleString('tr-TR')} {q.currency}</span> },
    { key: 'status', label: 'Durum', render: (q) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLOR_BG[QuoteStatusColor[q.status as keyof typeof QuoteStatusColor]]}`}>{QuoteStatusLabel[q.status as keyof typeof QuoteStatusLabel]}</span> },
    { key: 'actions', label: '', width: '180px', render: (q) => (
      <div className="flex gap-1">
        {q.status === QuoteStatus.DRAFT && <button onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ status: QuoteStatus.SENT }); }} className="rounded p-1 text-blue-600 hover:bg-blue-50" title="Gönder"><Send className="h-4 w-4" /></button>}
        {q.status === QuoteStatus.SENT && <button onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ status: QuoteStatus.ACCEPTED }); }} className="rounded p-1 text-green-600 hover:bg-green-50" title="Kabul Et"><Check className="h-4 w-4" /></button>}
        {q.status === QuoteStatus.SENT && <button onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ status: QuoteStatus.REJECTED, note: 'Müşteri reddetti' }); }} className="rounded p-1 text-red-600 hover:bg-red-50" title="Reddet"><X className="h-4 w-4" /></button>}
        {q.status === QuoteStatus.ACCEPTED && <button onClick={(e) => { e.stopPropagation(); setConfirmConvert({ id: q.id, type: 'ORDER' }); }} className="rounded p-1 text-purple-600 hover:bg-purple-50" title="Siparişe Çevir"><FileText className="h-4 w-4" /></button>}
        {q.status === QuoteStatus.ACCEPTED && <button onClick={(e) => { e.stopPropagation(); setConfirmConvert({ id: q.id, type: 'SALE' }); }} className="rounded p-1 text-emerald-600 hover:bg-emerald-50" title="Satışa Çevir"><Check className="h-4 w-4" /></button>}
        <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(q.id); }} className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Teklifler" description="Müşterilere gönderilen teklifler"
        actions={
          <button onClick={() => navigate('/quotes/new')} className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Plus className="h-4 w-4" /> Yeni Teklif</button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-md border border-outline bg-surface px-3 py-1.5">
          <Search className="h-4 w-4 text-on-surface-variant" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ara..." className="w-48 bg-transparent text-sm outline-none" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-outline bg-surface px-3 py-1.5 text-sm">
          <option value="">Tüm Durumlar</option>
          {Object.values(QuoteStatus).map((s) => <option key={s} value={s}>{QuoteStatusLabel[s]}</option>)}
        </select>
      </div>

      {isLoading ? <LoadingState /> : !data || data.items.length === 0 ? (
        <EmptyState icon={<FileText className="h-12 w-12" />} title="Henüz teklif yok" action={<button onClick={() => navigate('/quotes/new')} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary">İlk Teklifi Oluştur</button>} />
      ) : <>
        <div className="hidden md:block"><DataTable columns={columns} data={data.items.filter((q) => !search || q.customerName.toLowerCase().includes(search.toLowerCase()) || q.quoteNumber.toLowerCase().includes(search.toLowerCase()))} rowKey={(q) => q.id} onRowClick={(q) => navigate(`/quotes/${q.id}`)} /></div>
        <div className="md:hidden">
          <MobileCardList<any>
            data={data.items}
            keyFn={(q: any) => q.id}
            onItemClick={(q: any) => navigate(`/quotes/${q.id}`)}
            header={(q: any) => (
              <div className="flex items-center justify-between"><p className="font-mono text-xs text-on-surface-variant">{q.quoteNumber}</p><span className={`rounded-full px-2 py-0.5 text-xs ${COLOR_BG[QuoteStatusColor[q.status as keyof typeof QuoteStatusColor]]}`}>{QuoteStatusLabel[q.status as keyof typeof QuoteStatusLabel]}</span></div>
            )}
            subtitle={(q: any) => <p className="mt-1 font-semibold">{q.customerName}</p>}
            rightBadge={(q: any) => <span className="font-bold">{Number(q.grandTotal).toLocaleString('tr-TR')} {q.currency}</span>}
          />
        </div>
        {data.total > (data.pageSize ?? 20) && <div className="flex items-center justify-between"><p className="text-sm text-on-surface-variant">Toplam {data.total} teklif</p><div className="flex gap-1">{Array.from({ length: Math.ceil(data.total / (data.pageSize ?? 20)) }, (_, i) => i + 1).slice(0, 10).map((p) => <button key={p} onClick={() => setPage(p)} className={`rounded px-2 py-1 text-sm ${p === page ? 'bg-primary text-on-primary' : 'border'}`}>{p}</button>)}</div></div>}
      </>}

      <ConfirmModal open={!!confirmDelete} title="Teklif Silinsin mi?" confirmText="Sil" variant="danger" onClose={() => setConfirmDelete(null)} onConfirm={async () => { if (confirmDelete) { await delMut.mutateAsync(confirmDelete); setConfirmDelete(null); } }} />
      <ConfirmModal open={!!confirmConvert} title={confirmConvert?.type === 'ORDER' ? 'Siparişe Çevir' : 'Satışa Çevir'} description="Bu teklif kabul edildi. Dönüştürme işlemi geri alınamaz." confirmText="Dönüştür" variant="info" onClose={() => setConfirmConvert(null)} onConfirm={async () => {
        if (confirmConvert) {
          if (confirmConvert.type === 'ORDER') await toOrder.mutateAsync();
          else await toSale.mutateAsync();
          setConfirmConvert(null);
        }
      }} />
    </div>
  );
}
