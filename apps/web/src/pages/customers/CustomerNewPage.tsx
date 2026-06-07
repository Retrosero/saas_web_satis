import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, UserPlus, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useCreateCustomer } from '@/features/customers/api';
import type { CustomerType, CustomerStatus } from '@saas/shared';
import toast from 'react-hot-toast';

interface NewCustomerForm {
  name: string;
  type: CustomerType;
  contactName?: string;
  taxNumber?: string;
  taxOffice?: string;
  identityNumber?: string;
  phone?: string;
  phone2?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  district?: string;
  postalCode?: string;
  iban?: string;
  openingBalance?: number;
  creditLimit?: number;
  paymentTermDays?: number;
  notes?: string;
  status: CustomerStatus;
}

export function CustomerNewPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, watch } = useForm<NewCustomerForm>({
    defaultValues: {
      type: 'CUSTOMER',
      status: 'ACTIVE',
      paymentTermDays: 0,
      creditLimit: 0,
      openingBalance: 0,
    },
  });

  const create = useCreateCustomer();
  const openingBalance = watch('openingBalance') ?? 0;

  const onSubmit = (data: NewCustomerForm) => {
    create.mutate(
      {
        ...data,
        openingBalance: data.openingBalance ?? 0,
        creditLimit: data.creditLimit ?? 0,
        paymentTermDays: data.paymentTermDays ?? 0,
      },
      {
        onSuccess: (created) => {
          toast.success(`Cari oluşturuldu: ${created.code} — ${created.name}`);
          navigate(`/customers/${created.id}`);
        },
        onError: (err: unknown) => {
          const rawMessage = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
          const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : (rawMessage ?? 'Cari oluşturulamadı');
          toast.error(message);
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-4 max-w-4xl">
      <button
        onClick={() => navigate('/customers')}
        className="btn-ghost self-start text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Cari Listesine Dön
      </button>

      <PageHeader
        title="Yeni Cari Hesap"
        description="Müşteri veya tedarikçi hesabı oluşturun. Açılış bakiyesi varsa otomatik OPENING_BALANCE hareketi oluşturulur."
        actions={
          <button type="submit" form="new-customer-form" disabled={create.isPending} className="btn-primary">
            <UserPlus className="h-4 w-4" />
            {create.isPending ? 'Oluşturuluyor…' : 'Cari Oluştur'}
          </button>
        }
      />

      <form id="new-customer-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Temel bilgiler */}
        <div className="card p-6 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Temel Bilgiler
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Cari Adı / Firma Adı *</label>
              <input
                type="text"
                placeholder="Örn: Yıldız Tekstil A.Ş."
                {...register('name', { required: 'Cari adı zorunlu', minLength: { value: 2, message: 'En az 2 karakter' } })}
                className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:border-primary focus:outline-none"
              />
              {errors.name && <span className="text-xs text-error">{errors.name.message}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Cari Tipi</label>
              <select
                {...register('type')}
                className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:border-primary focus:outline-none"
              >
                <option value="CUSTOMER">Müşteri</option>
                <option value="SUPPLIER">Tedarikçi</option>
                <option value="BOTH">Müşteri + Tedarikçi</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Yetkili Kişi</label>
              <input
                type="text"
                placeholder="Ad Soyad"
                {...register('contactName')}
                className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Durum</label>
              <select
                {...register('status')}
                className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:border-primary focus:outline-none"
              >
                <option value="ACTIVE">Aktif</option>
                <option value="PASSIVE">Pasif</option>
                <option value="BLOCKED">Bloke</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vergi & Kimlik */}
        <div className="card p-6 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide">Vergi & Kimlik</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Vergi Numarası</label>
              <input
                type="text"
                placeholder="10 veya 11 haneli"
                {...register('taxNumber', { pattern: { value: /^\d{10,11}$/, message: '10-11 hane olmalı' } })}
                className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm font-mono focus:border-primary focus:outline-none"
              />
              {errors.taxNumber && <span className="text-xs text-error">{errors.taxNumber.message}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Vergi Dairesi</label>
              <input
                type="text"
                placeholder="Örn: Beşiktaş"
                {...register('taxOffice')}
                className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">TC Kimlik No (şahıslar için)</label>
              <input
                type="text"
                placeholder="11 hane"
                {...register('identityNumber', { pattern: { value: /^\d{11}$/, message: '11 hane olmalı' } })}
                className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm font-mono focus:border-primary focus:outline-none"
              />
              {errors.identityNumber && <span className="text-xs text-error">{errors.identityNumber.message}</span>}
            </div>
          </div>
        </div>

        {/* İletişim */}
        <div className="card p-6 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide">İletişim</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Telefon</label>
              <input
                type="tel"
                placeholder="0(5XX) XXX XX XX"
                {...register('phone')}
                className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Telefon 2</label>
              <input
                type="tel"
                {...register('phone2')}
                className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">E-posta</label>
              <input
                type="email"
                placeholder="info@firma.com"
                {...register('email', { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Geçerli e-posta girin' } })}
                className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:border-primary focus:outline-none"
              />
              {errors.email && <span className="text-xs text-error">{errors.email.message}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Web Sitesi</label>
              <input
                type="url"
                placeholder="https://"
                {...register('website')}
                className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-sm font-semibold text-foreground">Adres</label>
              <input
                type="text"
                {...register('address')}
                className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">İl</label>
              <input type="text" {...register('city')} className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:border-primary focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">İlçe</label>
              <input type="text" {...register('district')} className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:border-primary focus:outline-none" />
            </div>
          </div>
        </div>

        {/* Finansal */}
        <div className="card p-6 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide">Finansal Bilgiler</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Açılış Bakiyesi (₺)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('openingBalance', { valueAsNumber: true })}
                className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm font-mono focus:border-primary focus:outline-none"
              />
              {openingBalance !== 0 && (
                <span className="text-xs text-on-surface-variant">
                  {openingBalance > 0 ? 'Alacak' : 'Borç'} hareketi oluşturulacak
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Açık Hesap Limiti (₺)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0 = limitsiz"
                {...register('creditLimit', { valueAsNumber: true, min: 0 })}
                className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm font-mono focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Vade (gün)</label>
              <input
                type="number"
                min={0}
                max={365}
                {...register('paymentTermDays', { valueAsNumber: true, min: 0, max: 365 })}
                className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm font-mono focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-3">
              <label className="text-sm font-semibold text-foreground">IBAN</label>
              <input
                type="text"
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                {...register('iban', { pattern: { value: /^TR\d{24}$/, message: 'TR ile başlayan 26 karakter' } })}
                className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm font-mono focus:border-primary focus:outline-none"
              />
              {errors.iban && <span className="text-xs text-error">{errors.iban.message}</span>}
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-3">
              <label className="text-sm font-semibold text-foreground">Notlar</label>
              <textarea
                {...register('notes')}
                rows={3}
                className="px-3 py-2 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:border-primary focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => navigate('/customers')} className="btn-secondary">
            İptal
          </button>
          <button type="submit" disabled={create.isPending} className="btn-primary">
            {create.isPending ? 'Oluşturuluyor…' : 'Cari Oluştur'}
          </button>
        </div>
      </form>
    </div>
  );
}
