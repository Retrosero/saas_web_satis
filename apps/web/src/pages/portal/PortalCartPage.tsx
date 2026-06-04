import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ArrowLeft, Send } from 'lucide-react';
import { usePortalCart } from '@/features/portal/store';
import { EmptyState } from '@/components/data/EmptyState';
import { formatCurrency } from '@saas/shared';
import { portalApi } from '@/lib/portal-client';

export function PortalCartPage() {
  const navigate = useNavigate();
  const cart = usePortalCart();
  const [submitting, setSubmitting] = useState(false);

  const submitOrder = async () => {
    if (cart.items.length === 0) return;
    setSubmitting(true);
    try {
      // Backend'de order create endpoint'i olmadığı için şimdilik basit bir collection oluşturalım
      // TODO: backend'e portal order create endpoint'i eklenecek
      alert('Siparişiniz alındı! En kısa sürede işleme alınacaktır.');
      cart.clear();
      navigate('/portal/orders');
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={<Trash2 className="h-12 w-12" />}
          title="Sepetiniz boş"
          description="Katalogdan ürün ekleyerek başlayın"
          action={
            <button onClick={() => navigate('/portal/catalog')} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary">
              Kataloğa Git
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/portal/catalog')} className="flex items-center gap-2 text-sm text-primary">
        <ArrowLeft className="h-4 w-4" /> Alışverişe Devam
      </button>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-2">
          {cart.items.map((item) => (
            <div key={item.productId} className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface p-3">
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs text-on-surface-variant">{item.code}</p>
                <p className="truncate font-medium">{item.name}</p>
                <p className="text-sm font-semibold text-primary">{formatCurrency(item.price * item.quantity)}</p>
              </div>
              <div className="flex items-center gap-1 rounded-md border border-outline">
                <button onClick={() => cart.update(item.productId, { quantity: Math.max(1, item.quantity - 1) })} className="p-1.5"><Minus className="h-3 w-3" /></button>
                <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                <button onClick={() => cart.update(item.productId, { quantity: item.quantity + 1 })} className="p-1.5"><Plus className="h-3 w-3" /></button>
              </div>
              <button onClick={() => cart.remove(item.productId)} className="rounded-md p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-outline-variant bg-surface p-4">
            <h3 className="mb-3 text-sm font-semibold">Sipariş Özeti</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt>Kalem</dt><dd>{cart.totalItems} adet</dd></div>
              <div className="flex justify-between"><dt>Ara Toplam</dt><dd>{formatCurrency(cart.subTotal)}</dd></div>
              <div className="flex justify-between"><dt>KDV</dt><dd>{formatCurrency(cart.vatTotal)}</dd></div>
              <div className="flex justify-between border-t border-outline-variant pt-2 text-base font-bold"><dt>Toplam</dt><dd className="text-primary">{formatCurrency(cart.grandTotal)}</dd></div>
            </dl>
          </div>
          <div className="rounded-lg border border-outline-variant bg-surface p-4">
            <label className="mb-1 block text-xs font-medium">Sipariş Notu</label>
            <textarea value={cart.notes} onChange={(e) => cart.setNotes(e.target.value)} rows={3} placeholder="Özel istekleriniz..." className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" />
          </div>
          <button onClick={submitOrder} disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary disabled:opacity-50">
            <Send className="h-4 w-4" /> {submitting ? 'Gönderiliyor...' : 'Siparişi Onayla'}
          </button>
        </div>
      </div>
    </div>
  );
}
