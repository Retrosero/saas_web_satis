import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, X, UserPlus, Edit2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  ContractType,
  ContractTypeLabels,
  HrGender,
  MaritalStatus,
  WorkingType,
  WorkingTypeLabels,
  type CreateHrEmployeeDto,
} from '@saas/shared';
import { useCreateEmployee, useEmployee, useUpdateEmployee } from '@/features/hr/api';

const phoneRegex = /^(\+90|0)?\s?[0-9]{3}\s?[0-9]{3}\s?[0-9]{2}\s?[0-9]{2}$/;
const tcRegex = /^[0-9]{11}$/;
const ibanRegex = /^TR[0-9]{24}$/;

const schema = z.object({
  firstName: z.string().min(2, 'Ad en az 2 karakter olmalı'),
  lastName: z.string().min(2, 'Soyad en az 2 karakter olmalı'),
  identityNumber: z
    .string()
    .regex(tcRegex, '11 haneli TC girin')
    .optional()
    .or(z.literal('')),
  birthDate: z.string().optional(),
  gender: z.nativeEnum(HrGender).optional(),
  maritalStatus: z.nativeEnum(MaritalStatus).optional(),
  bloodType: z.string().optional(),
  phone: z
    .string()
    .regex(phoneRegex, 'Geçerli telefon girin')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Geçerli email girin').optional().or(z.literal('')),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z
    .string()
    .regex(phoneRegex, 'Geçerli telefon girin')
    .optional()
    .or(z.literal('')),
  iban: z
    .string()
    .regex(ibanRegex, 'TR ile başlayan 26 haneli IBAN girin')
    .optional()
    .or(z.literal('')),
  hireDate: z.string().optional(),
  notes: z.string().optional(),
  // Çalışma bilgileri
  department: z.string().optional(),
  branch: z.string().optional(),
  position: z.string().optional(),
  workingType: z.nativeEnum(WorkingType).optional(),
  contractType: z.nativeEnum(ContractType).optional(),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  probationMonths: z.coerce.number().int().min(0).default(0),
  sgkRegistrationNo: z.string().optional(),
  sgkEmployerNo: z.string().optional(),
  sgkWorkplaceCode: z.string().optional(),
  weeklyHours: z.coerce.number().min(0).max(60).optional(),
});

type FormData = z.infer<typeof schema>;

export function EmployeeFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;

  const { data: existing } = useEmployee(isEdit ? id! : null);
  const createMut = useCreateEmployee();
  const updateMut = useUpdateEmployee(id ?? '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      workingType: WorkingType.FULL_TIME,
      contractType: ContractType.INDEFINITE,
      probationMonths: 0,
    },
  });

  useEffect(() => {
    if (isEdit && existing) {
      reset({
        firstName: existing.firstName,
        lastName: existing.lastName,
        identityNumber: '',
        birthDate: existing.birthDate?.split('T')[0] ?? '',
        gender: existing.gender ?? undefined,
        maritalStatus: existing.maritalStatus ?? undefined,
        bloodType: existing.bloodType ?? '',
        phone: '',
        email: existing.email ?? '',
        address: existing.address ?? '',
        emergencyContact: existing.emergencyContact ?? '',
        emergencyPhone: '',
        iban: '',
        hireDate: existing.hireDate?.split('T')[0] ?? '',
        notes: existing.notes ?? '',
        department: existing.employment?.department ?? '',
        branch: existing.employment?.branch ?? '',
        position: existing.employment?.position ?? '',
        workingType: existing.employment?.workingType ?? WorkingType.FULL_TIME,
        contractType: existing.employment?.contractType ?? ContractType.INDEFINITE,
        contractStartDate: existing.employment?.contractStartDate?.split('T')[0] ?? '',
        contractEndDate: existing.employment?.contractEndDate?.split('T')[0] ?? '',
        probationMonths: existing.employment?.probationMonths ?? 0,
        sgkRegistrationNo: existing.employment?.sgkRegistrationNo ?? '',
        sgkEmployerNo: existing.employment?.sgkEmployerNo ?? '',
        sgkWorkplaceCode: existing.employment?.sgkWorkplaceCode ?? '',
        weeklyHours: existing.employment?.weeklyHours ?? undefined,
      });
    }
  }, [isEdit, existing, reset]);

  const onSubmit = async (data: FormData) => {
    const payload: CreateHrEmployeeDto = {
      firstName: data.firstName,
      lastName: data.lastName,
      identityNumber: data.identityNumber || undefined,
      birthDate: data.birthDate || undefined,
      gender: data.gender,
      maritalStatus: data.maritalStatus,
      bloodType: data.bloodType || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      address: data.address || undefined,
      emergencyContact: data.emergencyContact || undefined,
      emergencyPhone: data.emergencyPhone || undefined,
      iban: data.iban ? data.iban.replace(/\s/g, '').toUpperCase() : undefined,
      hireDate: data.hireDate || undefined,
      notes: data.notes || undefined,
      employment: {
        department: data.department || undefined,
        branch: data.branch || undefined,
        position: data.position || undefined,
        workingType: data.workingType,
        contractType: data.contractType,
        contractStartDate: data.contractStartDate || undefined,
        contractEndDate: data.contractEndDate || undefined,
        probationMonths: data.probationMonths ?? 0,
        sgkRegistrationNo: data.sgkRegistrationNo || undefined,
        sgkEmployerNo: data.sgkEmployerNo || undefined,
        sgkWorkplaceCode: data.sgkWorkplaceCode || undefined,
        weeklyHours: data.weeklyHours || undefined,
      },
    };

    if (isEdit) {
      await updateMut.mutateAsync(payload);
    } else {
      await createMut.mutateAsync(payload);
    }
    navigate('/hr/employees');
  };

  const isSubmitting = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-4">
      <PageHeader
        title={isEdit ? 'Personel Düzenle' : 'Yeni Personel'}
        description={isEdit ? existing?.fullName : 'Yeni çalışan bilgilerini girin'}
        actions={
          <button
            onClick={() => navigate('/hr/employees')}
            className="flex items-center gap-1 rounded-md border border-outline bg-surface px-3 py-2 text-sm hover:bg-bg-subtle"
          >
            <X className="h-4 w-4" /> İptal
          </button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Kişisel Bilgiler */}
        <Section title="Kişisel Bilgiler" icon={<UserPlus className="h-4 w-4" />}>
          <Grid>
            <Field label="Ad *" error={errors.firstName?.message}>
              <input {...register('firstName')} className={inputCls} />
            </Field>
            <Field label="Soyad *" error={errors.lastName?.message}>
              <input {...register('lastName')} className={inputCls} />
            </Field>
            <Field label="TC Kimlik No" error={errors.identityNumber?.message} hint="Hassas veri">
              <input {...register('identityNumber')} maxLength={11} className={inputCls} placeholder="11 hane" />
            </Field>
            <Field label="Doğum Tarihi">
              <input type="date" {...register('birthDate')} className={inputCls} />
            </Field>
            <Field label="Cinsiyet">
              <select {...register('gender')} className={inputCls}>
                <option value="">—</option>
                <option value={HrGender.MALE}>Erkek</option>
                <option value={HrGender.FEMALE}>Kadın</option>
                <option value={HrGender.OTHER}>Diğer</option>
              </select>
            </Field>
            <Field label="Medeni Durum">
              <select {...register('maritalStatus')} className={inputCls}>
                <option value="">—</option>
                <option value={MaritalStatus.SINGLE}>Bekar</option>
                <option value={MaritalStatus.MARRIED}>Evli</option>
                <option value={MaritalStatus.DIVORCED}>Boşanmış</option>
                <option value={MaritalStatus.WIDOWED}>Dul</option>
              </select>
            </Field>
            <Field label="Kan Grubu">
              <input {...register('bloodType')} className={inputCls} placeholder="A Rh+" />
            </Field>
          </Grid>
        </Section>

        {/* İletişim */}
        <Section title="İletişim" icon={<Edit2 className="h-4 w-4" />}>
          <Grid>
            <Field label="Telefon" error={errors.phone?.message}>
              <input {...register('phone')} className={inputCls} placeholder="0532 123 45 67" />
            </Field>
            <Field label="E-posta" error={errors.email?.message}>
              <input type="email" {...register('email')} className={inputCls} />
            </Field>
            <Field label="Acil Durum Kişisi">
              <input {...register('emergencyContact')} className={inputCls} />
            </Field>
            <Field label="Acil Durum Telefonu" error={errors.emergencyPhone?.message}>
              <input {...register('emergencyPhone')} className={inputCls} />
            </Field>
            <Field label="Adres" full>
              <textarea {...register('address')} rows={2} className={inputCls} />
            </Field>
          </Grid>
        </Section>

        {/* Banka */}
        <Section title="Banka Bilgileri" icon={<Edit2 className="h-4 w-4" />}>
          <Grid>
            <Field label="IBAN" error={errors.iban?.message} hint="Hassas veri">
              <input {...register('iban')} className={inputCls} placeholder="TR00 0000 0000 0000 0000 0000 00" maxLength={32} />
            </Field>
          </Grid>
        </Section>

        {/* Çalışma */}
        <Section title="Çalışma Bilgileri" icon={<Edit2 className="h-4 w-4" />}>
          <Grid>
            <Field label="İşe Giriş Tarihi">
              <input type="date" {...register('hireDate')} className={inputCls} />
            </Field>
            <Field label="Çalışma Tipi">
              <select {...register('workingType')} className={inputCls}>
                {Object.entries(WorkingTypeLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Sözleşme Tipi">
              <select {...register('contractType')} className={inputCls}>
                {Object.entries(ContractTypeLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Sözleşme Başlangıç">
              <input type="date" {...register('contractStartDate')} className={inputCls} />
            </Field>
            <Field label="Sözleşme Bitiş">
              <input type="date" {...register('contractEndDate')} className={inputCls} />
            </Field>
            <Field label="Deneme Süresi (ay)">
              <input type="number" min={0} max={12} {...register('probationMonths', { valueAsNumber: true })} className={inputCls} />
            </Field>
            <Field label="Departman">
              <input {...register('department')} className={inputCls} />
            </Field>
            <Field label="Şube">
              <input {...register('branch')} className={inputCls} />
            </Field>
            <Field label="Görev / Pozisyon">
              <input {...register('position')} className={inputCls} />
            </Field>
            <Field label="Haftalık Çalışma Saati">
              <input type="number" step="0.5" min={0} max={60} {...register('weeklyHours', { valueAsNumber: true })} className={inputCls} />
            </Field>
          </Grid>
        </Section>

        {/* SGK */}
        <Section title="SGK Bilgileri" icon={<Edit2 className="h-4 w-4" />}>
          <Grid>
            <Field label="SGK Sicil No">
              <input {...register('sgkRegistrationNo')} className={inputCls} />
            </Field>
            <Field label="SGK İşveren No">
              <input {...register('sgkEmployerNo')} className={inputCls} />
            </Field>
            <Field label="SGK İşyeri Kodu">
              <input {...register('sgkWorkplaceCode')} className={inputCls} />
            </Field>
          </Grid>
        </Section>

        {/* Notlar */}
        <Section title="Notlar" icon={<Edit2 className="h-4 w-4" />}>
          <Field label="Ek Notlar" full>
            <textarea {...register('notes')} rows={3} className={inputCls} />
          </Field>
        </Section>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate('/hr/employees')}
            className="rounded-md border border-outline bg-surface px-4 py-2 text-sm hover:bg-bg-subtle"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls = 'w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm focus:border-primary focus:outline-none';

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-outline bg-surface p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function Field({
  label,
  error,
  hint,
  full,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? 'md:col-span-2 lg:col-span-3' : ''}>
      <label className="mb-1 flex items-center justify-between text-xs font-medium text-fg-muted">
        <span>{label}</span>
        {hint && <span className="text-[10px] text-amber-600">🔒 {hint}</span>}
      </label>
      {children}
      {error && <p className="mt-0.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
