import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, Save, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { useBankAccount, useCreateBankAccount, useUpdateBankAccount } from '@/features/banks/api';
import { BankAccountStatusLabel, BankAccountTypeLabel, type BankAccountStatus, type BankAccountType } from '@saas/shared';

export function BankAccountFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const { data: existing, isLoading } = useBankAccount(id ?? '');
  const createMut = useCreateBankAccount();
  const updateMut = useUpdateBankAccount(id ?? '');

  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [iban, setIban] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [currency, setCurrency] = useState('TRY');
  const [type, setType] = useState<BankAccountType>('CHECKING');
  const [status, setStatus] = useState<BankAccountStatus>('ACTIVE');
  const [branchCode, setBranchCode] = useState('');
  const [branchName, setBranchName] = useState('');
  const [notes, setNotes] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (existing && isEdit) {
      setBankName(existing.bankName);
      setAccountName(existing.accountName);
      setIban(existing.iban ?? '');
      setAccountNumber(existing.accountNumber ?? '');
      setCurrency(existing.currency);
      setType(existing.type);
      setStatus(existing.status);
      setBranchCode(existing.branchCode ?? '');
      setBranchName(existing.branchName ?? '');
      setNotes(existing.notes ?? '');
      setIsDefault(existing.isDefault);
    }
  }, [existing, isEdit]);

  if (isLoading && isEdit) return <LoadingState />;

  const submit = async () => {
    const payload = {
      bankName, accountName,
      iban: iban || undefined, accountNumber: accountNumber || undefined,
      currency, type, status, branchCode: branchCode || undefined, branchName: branchName || undefined,
      notes: notes || undefined, isDefault,
    };
    if (isEdit) await updateMut.mutateAsync(payload);
    else await createMut.mutateAsync(payload);
    navigate('/banks/accounts');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={isEdit ? 'Banka Hesabı Düzenle' : 'Yeni Banka Hesabı'}
        description="Firmanın banka hesap bilgilerini girin"
        actions={
          <button onClick={() => navigate('/banks/accounts')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm">
            <ArrowLeft className="h-4 w-4" /> Geri
          </button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-outline-variant bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold">Banka Bilgileri</h3>
          <div className="space-y-3">
            <div><label className="mb-1 block text-xs font-medium">Banka Adı *</label><input value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Hesap Adı *</label><input value={accountName} onChange={(e) => setAccountName(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-1 block text-xs font-medium">Şube Kodu</label><input value={branchCode} onChange={(e) => setBranchCode(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
              <div><label className="mb-1 block text-xs font-medium">Şube Adı</label><input value={branchName} onChange={(e) => setBranchName(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            </div>
            <div><label className="mb-1 block text-xs font-medium">IBAN</label><input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="TR00 0000 0000 0000 0000 0000 00" className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" /></div>
            <div><label className="mb-1 block text-xs font-medium">Hesap No</label><input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
          </div>
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold">Ayarlar</h3>
          <div className="space-y-3">
            <div><label className="mb-1 block text-xs font-medium">Para Birimi *</label><select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm"><option>TRY</option><option>USD</option><option>EUR</option><option>GBP</option></select></div>
            <div><label className="mb-1 block text-xs font-medium">Hesap Tipi *</label><select value={type} onChange={(e) => setType(e.target.value as BankAccountType)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">{Object.entries(BankAccountTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div><label className="mb-1 block text-xs font-medium">Durum *</label><select value={status} onChange={(e) => setStatus(e.target.value as BankAccountStatus)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">{Object.entries(BankAccountStatusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} /> Varsayılan hesap</label>
            <div><label className="mb-1 block text-xs font-medium">Notlar</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={() => navigate('/banks/accounts')} className="rounded-md border border-outline px-4 py-2 text-sm">İptal</button>
        <button onClick={submit} disabled={!bankName || !accountName || createMut.isPending || updateMut.isPending} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-40">
          <Save className="h-4 w-4" /> {isEdit ? 'Güncelle' : 'Kaydet'}
        </button>
      </div>
    </div>
  );
}
