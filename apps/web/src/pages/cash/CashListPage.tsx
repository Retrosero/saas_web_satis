import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Plus, Search, Pencil, Power } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/data/EmptyState';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useCashAccounts, useCreateCashAccount } from '@/features/cash/api';
import { usePermission } from '@/lib/usePermission';
import { formatCurrency } from '@saas/shared';
import type { CashAccountType, CashAccountStatus } from '@saas/shared';
import toast from 'react-hot-toast';

const TYPE_LABEL: Record<CashAccountType, { text: string; color: string; icon: string }> = {
  CASH: { text: 'Kasa', color: 'bg-tertiary-container text-tertiary', icon: '💵' },
  BANK: { text: 'Banka', color: 'bg-secondary-container text-secondary', icon: '🏦' },
  POS: { text: 'POS', color: 'bg-primary-container text-primary', icon: '💳' },
};

const STATUS_LABEL: Record<CashAccountStatus, { text: string; color: string }> = {
  ACTIVE: { text: 'Aktif', color: 'bg-secondary-container text-secondary' },
  PASSIVE: { text: 'Pasif', color: 'bg-surface-variant text-on-surface-variant' },
};

export function CashListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<CashAccountType | undefined>();
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<CashAccountType>('CASH');
  const [newBankName, setNewBankName] = useState('');

  const { data, isLoading, isError, error, refetch } = useCashAccounts({
    type: typeFilter,
    search: search || undefined,
  });
  const create = useCreateCashAccount();

  const canView = usePermission('kasa:cash_account:view');
  const canCreate = usePermission('kasa:cash_account:create');

  const handleCreate = () => {
    if (!newCode.trim() || !newName.trim()) {
      toast.error('Kod ve ad zorunludur');
      return;
    }
    create.mutate(
      {
        code: newCode.trim().toUpperCase(),
        name: newName.trim(),
        type: newType,
        bankName: newBankName.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Kasa/banka oluşturuldu');
          setShowNewModal(false);
          setNewCode('');
          setNewName('');
          setNewType('CASH');
          setNewBankName('');
        },
        onError: (err: unknown) => {
          toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Hata');
        },
      },
    );
  };

  const totalBalance = data?.data.reduce((sum, a) => sum + (a.balance ?? 0), 0) ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Kasa / Banka"
        description="Nakit, banka ve POS hesapları — bakiyeler event-sourced"
        actions={
          canCreate ? (
            <button onClick={() => setShowNewModal(true)} className="btn-primary">
              <Plus className="h-4 w-4" />
              Yeni Hesap
            </button>
          ) : null
        }
      />

      <div className="card p-3 flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kod, ad veya banka adı ile ara…"
            className="w-full h-10 pl-10 pr-4 rounded-md bg-surface-container text-sm border border-outline-variant focus:border-primary focus:outline-none"
          />
        </div>
        <select
          value={typeFilter ?? ''}
          onChange={(e) => setTypeFilter((e.target.value as CashAccountType) || undefined)}
          className="h-10 px-3 rounded-md bg-surface-container text-sm border border-outline-variant"
        >
          <option value="">Tüm tipler</option>
          <option value="CASH">Kasa</option>
          <option value="BANK">Banka</option>
          <option value="POS">POS</option>
        </select>
      </div>

      {isLoading && <LoadingState label="Hesaplar yükleniyor…" />}
      {isError && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}
      {!isLoading && !isError && !canView && (
        <div className="rounded-lg border border-error/30 bg-error-container/20 p-8 text-center">
          <p className="text-error font-medium">Bu sayfayı görüntüleme yetkiniz yok.</p>
        </div>
      )}
      {data && data.data.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<Wallet className="h-8 w-8" />}
            title="Henüz kasa/banka yok"
            description="Nakit kasa, banka hesabı veya POS cihazı ekleyerek başlayın."
            action={
              canCreate ? (
                <button onClick={() => setShowNewModal(true)} className="btn-primary">
                  <Plus className="h-4 w-4" />
                  İlk Hesabı Oluştur
                </button>
              ) : null
            }
          />
        </div>
      )}
      {data && data.data.length > 0 && (
        <>
          {/* Toplam bakiye */}
          <div className="card p-4 flex justify-between items-center">
            <span className="font-semibold text-foreground">Toplam Bakiye</span>
            <span className="font-mono font-bold text-secondary text-xl">
              {formatCurrency(totalBalance)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.data.map((account) => {
              const t = TYPE_LABEL[account.type];
              const s = STATUS_LABEL[account.status];
              return (
                <div
                  key={account.id}
                  className="card p-4 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/cash/${account.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-foreground">{account.code}</span>
                        <span className="text-lg">{t.icon}</span>
                        {account.isDefault && (
                          <span className="text-xs bg-primary-container text-primary px-1.5 py-0.5 rounded-full">Varsayılan</span>
                        )}
                      </div>
                      <div className="font-medium text-foreground mt-1">{account.name}</div>
                      {account.bankName && (
                        <div className="text-xs text-on-surface-variant mt-0.5">{account.bankName}</div>
                      )}
                    </div>
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${s.color}`}>
                      {s.text}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-t border-outline-variant pt-3">
                    <span className="text-xs text-on-surface-variant">
                      {account.movementCount ?? 0} hareket
                    </span>
                    <span className={`font-mono font-bold text-lg ${
                      (account.balance ?? 0) >= 0 ? 'text-secondary' : 'text-error'
                    }`}>
                      {formatCurrency(account.balance ?? 0)}
                    </span>
                  </div>

                  {account.iban && (
                    <div className="text-xs font-mono text-on-surface-variant">{account.iban}</div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Yeni hesap modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Yeni Kasa / Banka</h2>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1">Kod *</label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="K-001"
                    className="w-full h-10 px-3 rounded-md bg-surface-container text-sm border border-outline-variant"
                  />
                </div>
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1">Tür *</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as CashAccountType)}
                    className="w-full h-10 px-3 rounded-md bg-surface-container text-sm border border-outline-variant"
                  >
                    <option value="CASH">💵 Kasa (Nakit)</option>
                    <option value="BANK">🏦 Banka</option>
                    <option value="POS">💳 POS</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">Ad *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Kasa adı veya banka hesabı"
                  className="w-full h-10 px-3 rounded-md bg-surface-container text-sm border border-outline-variant"
                />
              </div>
              {newType === 'BANK' && (
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1">Banka Adı</label>
                  <input
                    type="text"
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    placeholder="Garanti, İş Bankası, vb."
                    className="w-full h-10 px-3 rounded-md bg-surface-container text-sm border border-outline-variant"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={handleCreate}
                disabled={create.isPending}
                className="flex-1 font-semibold py-2.5 rounded-md bg-primary text-on-primary hover:bg-primary-hover disabled:opacity-50"
              >
                {create.isPending ? 'Oluşturuluyor…' : '✓ Oluştur'}
              </button>
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2.5 text-sm text-on-surface-variant hover:text-foreground"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}