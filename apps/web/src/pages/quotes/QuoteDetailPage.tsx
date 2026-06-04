import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Send, Check, X, Printer, FileDown, ShoppingCart, ShoppingBag } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { useQuote, useUpdateQuoteStatus, useConvertQuoteToOrder, useConvertQuoteToSale } from '@/features/quotes/api';
import { QuoteStatus, QuoteStatusLabel, QuoteStatusColor, formatDate } from '@saas/shared';

const COLOR_BG: Record<string, string> = { blue: 'bg-blue-100 text-blue-800', green: 'bg-green-100 text-green-800', red: 'bg-red-100 text-red-800', amber: 'bg-amber-100 text-amber-800', gray: 'bg-gray-200 text-gray-700' };

export function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: q, isLoading } = useQuote(id);
  const updateStatus = useUpdateQuoteStatus(id!);
  const toOrder = useConvertQuoteToOrder(id!);
  const toSale = useConvertQuoteToSale(id!);

  if (isLoading) return <LoadingState />;
  if (!q) return <p className="p-4">Teklif bulunamadı</p>;

  return (
    <div className="space-y-4">
      <PageHeader title={`Teklif ${q.quoteNumber}`} description={`${q.customerName} • ${formatDate(q.quoteDate)}`}
        actions={
          <div className="flex gap-2">
            <button onClick={() => navigate('/quotes')} className="flex items-center gap-1 rounded-md border border-outline px-3 py-2 text-sm"><ArrowLeft className="h-4 w-4" /> Geri</button>
            <button onClick={() => window.print()} className="flex items-center gap-1 rounded-md border border-outline px-3 py-2 text-sm"><Printer className="h-4 w-4" /> Yazdır</button>
            {q.status === QuoteStatus.DRAFT && <button onClick={() => updateStatus.mutate({ status: QuoteStatus.SENT })} className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm text-white"><Send className="h-4 w-4" /> Gönder</button>}
            {q.status === QuoteStatus.SENT && <>
              <button onClick={() => updateStatus.mutate({ status: QuoteStatus.ACCEPTED })} className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-2 text-sm text-white"><Check className="h-4 w-4" /> Kabul</button>
              <button onClick={() => updateStatus.mutate({ status: QuoteStatus.REJECTED, note: 'Müşteri reddetti' })} className="flex items-center gap-1 rounded-md bg-red-600 px-3 py-2 text-sm text-white"><X className="h-4 w-4" /> Reddet</button>
            </>}
            {q.status === QuoteStatus.ACCEPTED && <>
              <button onClick={() => toOrder.mutate()} className="flex items-center gap-1 rounded-md bg-purple-600 px-3 py-2 text-sm text-white"><ShoppingBag className="h-4 w-4" /> Siparişe Çevir</button>
              <button onClick={() => toSale.mutate()} className="flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-2 text-sm text-white"><ShoppingCart className="h-4 w-4" /> Satışa Çevir</button>
            </>}
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-outline bg-surface p-3"><p className="text-xs text-on-surface-variant">Durum</p><p className={`mt-1 inline-block rounded-full px-2 py-0.5 text-sm ${COLOR_BG[QuoteStatusColor[q.status as keyof typeof QuoteStatusColor]]}`}>{QuoteStatusLabel[q.status as keyof typeof QuoteStatusLabel]}</p></div>
        <div className="rounded-lg border border-outline bg-surface p-3"><p className="text-xs text-on-surface-variant">Teklif Tarihi</p><p className="mt-1 font-semibold">{formatDate(q.quoteDate)}</p></div>
        <div className="rounded-lg border border-outline bg-surface p-3"><p className="text-xs text-on-surface-variant">Geçerlilik</p><p className={`mt-1 font-semibold ${new Date(q.validUntil) < new Date() ? 'text-red-600' : ''}`}>{formatDate(q.validUntil)}</p></div>
        <div className="rounded-lg border border-outline bg-surface p-3"><p className="text-xs text-on-surface-variant">Para Birimi</p><p className="mt-1 font-semibold">{q.currency}</p></div>
      </div>

      <div className="rounded-lg border border-outline bg-surface">
        <div className="border-b border-outline-variant p-3"><h3 className="font-semibold">Satırlar</h3></div>
        <table className="w-full text-sm">
          <thead className="bg-surface-variant text-xs uppercase"><tr><th className="px-3 py-2 text-left">Ürün</th><th className="px-2 py-2 text-right">Miktar</th><th className="px-2 py-2 text-right">Birim Fiyat</th><th className="px-2 py-2 text-right">İsk %</th><th className="px-2 py-2 text-right">KDV %</th><th className="px-2 py-2 text-right">Toplam</th></tr></thead>
          <tbody>
            {(q.items ?? []).map((it: any, i: number) => (
              <tr key={i} className="border-t border-outline-variant">
                <td className="px-3 py-2"><p className="font-medium">{it.productName}</p><p className="text-xs text-on-surface-variant">{it.productCode}</p></td>
                <td className="px-2 py-2 text-right">{Number(it.quantity).toLocaleString('tr-TR')}</td>
                <td className="px-2 py-2 text-right">{Number(it.unitPrice).toLocaleString('tr-TR')}</td>
                <td className="px-2 py-2 text-right">{Number(it.discountRate).toLocaleString('tr-TR')}</td>
                <td className="px-2 py-2 text-right">{Number(it.vatRate).toLocaleString('tr-TR')}</td>
                <td className="px-2 py-2 text-right font-semibold">{Number(it.lineTotal).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-outline-variant bg-surface-variant"><td colSpan={5} className="px-3 py-2 text-right">Ara Toplam:</td><td className="px-2 py-2 text-right">{Number(q.subTotal).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</td></tr>
            <tr><td colSpan={5} className="px-3 py-2 text-right">KDV:</td><td className="px-2 py-2 text-right">{Number(q.vatTotal).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</td></tr>
            <tr className="bg-blue-50"><td colSpan={5} className="px-3 py-2 text-right font-bold">Genel Toplam:</td><td className="px-2 py-2 text-right text-lg font-bold">{Number(q.grandTotal).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} {q.currency}</td></tr>
          </tfoot>
        </table>
      </div>

      {q.notes && <div className="rounded-lg border border-outline bg-surface p-3"><h3 className="mb-1 text-sm font-semibold">Notlar</h3><p className="text-sm">{q.notes}</p></div>}

      {(q as any).statusLogs && (q as any).statusLogs.length > 0 && (
        <div className="rounded-lg border border-outline bg-surface p-3">
          <h3 className="mb-2 text-sm font-semibold">Durum Geçmişi</h3>
          <ul className="space-y-1 text-xs">
            {((q as any).statusLogs as any[]).map((l) => <li key={l.id} className="flex gap-2"><span className="text-on-surface-variant">{formatDate(l.createdAt)}</span><span>{l.fromStatus ? `${l.fromStatus} → ` : ''}{l.toStatus}</span>{l.note && <span className="text-on-surface-variant">— {l.note}</span>}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
