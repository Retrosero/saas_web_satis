import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Save, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useBankAccounts } from '@/features/banks/api';
import { useCreateBankTransaction } from '@/features/banks/api';
import { BankTransactionTypeLabel, type BankTransactionType } from '@saas/shared';

export function BankTransactionNewPage() {
  const navigate = useNavigate();
  const { data: accounts = [] } = useBankAccounts();
  const createMut = useCreateBankTransaction();
  const [bankAccountId, setBankAccountId] = useState('');
  const [counterBankAccountId, setCounterBankAccountId] = useState('');
  const [txnDate, setTxnDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<BankTransactionType>('DEPOSIT');
  const [amount, setAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState('TRY');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [customerId, setCustomerId] = useState('');
  const [description, setDescription] = useState('');
  const [refNumber, setRefNumber] = useState('');

  // Hesap seçilince PB'sini al
  useEffect(() => {
    const acc = accounts.find((a) => a.id === bankAccountId);
    if (acc) setCurrency(acc.currency);
  }, [bankAccountId, accounts]);

  const submit = async () => {
    if (!bankAccountId || amount === '') return;
    await createMut.mutateAsync({
      bankAccountId, txnDate, type, amount: Number(amount), currency, exchangeRate,
      customerId: customerId || undefined, counterBankAccountId: type === 'TRANSFER' ? counterBankAccountId : undefined,
      description: description || undefined, refNumber: refNumber || undefined,
    } as any);
    navigate('/banks/transactions');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Yeni Banka İşlemi"
        description="Banka hesabına hareket kaydı girin"
        actions={<button onClick={() => navigate('/banks/transactions')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><ArrowLeft className="h-4 w-4" /> Geri</button>}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-outline-variant bg-surface p-4 space-y-3">
          <h3 className="text-sm font-semibold">İşlem Bilgileri</h3>
          <div>
            <label className="mb-1 block text-xs font-medium">Banka Hesabı *</label>
            <select value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
              <option value="">Seçiniz...</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.bankName} - {a.accountName} ({a.currency})</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">İşlem Tipi *</label>
            <select value={type} onChange={(e) => setType(e.target.value as BankTransactionType)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
              {Object.entries(BankTransactionTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          {type === 'TRANSFER' && (
            <div>
              <label className="mb-1 block text-xs font-medium">Karşı Hesap *</label>
              <select value={counterBankAccountId} onChange={(e) => setCounterBankAccountId(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
                <option value="">Seçiniz...</option>
                {accounts.filter((a) => a.id !== bankAccountId).map((a) => <option key={a.id} value={a.id}>{a.bankName} - {a.accountName}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs font-medium">Tarih *</label><input type="date" value={txnDate} onChange={(e) => setTxnDate(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Tutar *</label><input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs font-medium">Para Birimi</label><input value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Döviz Kuru</label><input type="number" step="0.0001" min="0" value={exchangeRate} onChange={(e) => setExchangeRate(Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
          </div>
          <div><label className="mb-1 block text-xs font-medium">Cari (opsiyonel)</label><input value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="Cari ID" className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" /></div>
          <div><label className="mb-1 block text-xs font-medium">Belge No</label><input value={refNumber} onChange={(e) => setRefNumber(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
          <div><label className="mb-1 block text-xs font-medium">Açıklama</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={() => navigate('/banks/transactions')} className="rounded-md border border-outline px-4 py-2 text-sm">İptal</button>
        <button onClick={submit} disabled={!bankAccountId || amount === '' || createMut.isPending} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-40">
          <Save className="h-4 w-4" /> Kaydet
        </button>
      </div>
    </div>
  );
}
