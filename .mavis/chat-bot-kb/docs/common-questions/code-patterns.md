# En Çok Kullanılan Kod Pattern'leri

## Backend (NestJS + Prisma)

### Service Pattern
```ts
@Injectable()
export class XxxService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, params: { page?: number; pageSize?: number; status?: string }) {
    const where: any = { tenantId, isDeleted: false };
    if (params.status) where.status = params.status;
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const [items, total] = await Promise.all([
      this.prisma.client.xxx.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.client.xxx.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async get(tenantId: string, id: string) {
    const item = await this.prisma.client.xxx.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!item) throw new NotFoundException('Kayıt bulunamadı');
    return item;
  }

  async create(tenantId: string, input: any, userId: string) {
    return this.prisma.client.xxx.create({ data: { ...input, tenantId, createdById: userId } });
  }

  async update(tenantId: string, id: string, input: any) {
    await this.get(tenantId, id); // exists check
    return this.prisma.client.xxx.update({ where: { id }, data: input });
  }

  async delete(tenantId: string, id: string) {
    const item = await this.get(tenantId, id);
    await this.prisma.client.xxx.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
  }
}
```

### Controller Pattern
```ts
@ApiTags('xxx') @ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('xxx')
export class XxxController {
  constructor(private readonly svc: XxxService) {}

  @Get() list(@Req() req: any, @Query() q: any) { return this.svc.list(req.user.tenantId, q); }
  @Get(':id') get(@Req() req: any, @Param('id') id: string) { return this.svc.get(req.user.tenantId, id); }
  @Post() create(@Req() req: any, @Body() body: any) { return this.svc.create(req.user.tenantId, body, req.user.id); }
  @Put(':id') update(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.svc.update(req.user.tenantId, id, body); }
  @Delete(':id') delete(@Req() req: any, @Param('id') id: string) { return this.svc.delete(req.user.tenantId, id); }
}
```

### Event Sourcing (Bakiye Hesaplama)
```ts
async getBalance(tenantId: string, customerId: string) {
  const movements = await this.prisma.client.customerMovement.findMany({
    where: { tenantId, customerId, isDeleted: false }
  });
  return movements.reduce((s, m) => s + Number(m.amount ?? 0), 0);
}

async recordMovement(tenantId: string, customerId: string, amount: number, type: string, refType: string, refId: string) {
  return this.prisma.client.customerMovement.create({
    data: { tenantId, customerId, amount, type, refType, refId }
  });
}
```

### Transaction Pattern
```ts
async transferMoney(tenantId: string, fromId: string, toId: string, amount: number, userId: string) {
  return this.prisma.client.$transaction(async (tx) => {
    // 1) Müşteri 1'den çıkış
    await tx.customerMovement.create({
      data: { tenantId, customerId: fromId, amount: -amount, type: 'TRANSFER', refType: 'Transfer', refId: toId }
    });
    // 2) Müşteri 2'ye giriş
    await tx.customerMovement.create({
      data: { tenantId, customerId: toId, amount, type: 'TRANSFER', refType: 'Transfer', refId: fromId }
    });
    // 3) Audit log
    await tx.securityLog.create({
      data: { tenantId, userId, event: 'customer.transfer', metadata: { fromId, toId, amount } }
    });
  });
}
```

## Frontend (React + TypeScript)

### Feature API Pattern
```ts
// src/features/customers/api.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Customer } from '@saas/shared';

export function useCustomers(params?: { page?: number; status?: string }) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: Customer[]; total: number }>('/customers', { params });
      return data;
    },
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Customer>) => {
      const { data } = await apiClient.post<Customer>('/customers', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}
```

### Sayfa Pattern
```tsx
// src/pages/customers/CustomerListPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { MobileCardList } from '@/components/data/MobileCardList';
import { useCustomers, useDeleteCustomer } from '@/features/customers/api';

export function CustomerListPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useCustomers();
  const delMut = useDeleteCustomer();
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const columns: DataTableColumn<any>[] = [
    { key: 'name', label: 'Cari Adı', render: (c) => <span className="font-semibold">{c.name}</span> },
    { key: 'code', label: 'Kod', render: (c) => <span className="font-mono text-xs">{c.code}</span> },
    { key: 'balance', label: 'Bakiye', align: 'right', render: (c) => Number(c.balance ?? 0).toLocaleString('tr-TR') + ' TRY' },
    {
      key: 'actions', label: '', width: '50px',
      render: (c) => (
        <button onClick={(e) => { e.stopPropagation(); setConfirmDel(c.id); }} className="rounded p-1 text-red-600 hover:bg-red-50">
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Cariler"
        description="Müşteri ve tedarikçi listesi"
        actions={
          <button onClick={() => navigate('/customers/new')} className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary">
            <Plus className="h-4 w-4" /> Yeni Cari
          </button>
        }
      />

      {isLoading ? <LoadingState /> : !data?.items?.length ? (
        <EmptyState icon={<Users className="h-12 w-12" />} title="Henüz cari yok" action={<button onClick={() => navigate('/customers/new')} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary">İlk Cariyi Ekle</button>} />
      ) : (
        <>
          <div className="hidden md:block"><DataTable columns={columns} data={data.items} rowKey={(c) => c.id} onRowClick={(c) => navigate(`/customers/${c.id}`)} /></div>
          <div className="md:hidden">
            <MobileCardList<any>
              data={data.items}
              keyFn={(c) => c.id}
              onItemClick={(c) => navigate(`/customers/${c.id}`)}
              header={(c) => <div className="flex justify-between"><p className="font-mono text-xs">{c.code}</p><p className="font-bold">{Number(c.balance ?? 0).toLocaleString('tr-TR')}</p></div>}
              subtitle={(c) => <p className="font-semibold">{c.name}</p>}
            />
          </div>
        </>
      )}

      <ConfirmModal
        open={!!confirmDel}
        title="Cari Silinsin mi?"
        description="Bu cari soft delete ile arşivlenecek."
        confirmText="Sil"
        variant="danger"
        onClose={() => setConfirmDel(null)}
        onConfirm={async () => { if (confirmDel) { await delMut.mutateAsync(confirmDel); setConfirmDel(null); } }}
      />
    </div>
  );
}
```

### Form Pattern (react-hook-form + zod)
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2, 'Ad en az 2 karakter olmalı'),
  code: z.string().min(2, 'Kod gerekli'),
  email: z.string().email('Geçerli email girin').optional().or(z.literal('')),
  phone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function CustomerForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const createMut = useCreateCustomer();

  const onSubmit = async (data: FormData) => {
    await createMut.mutateAsync(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="text-xs">Ad *</label>
        <input {...register('name')} className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm" />
        {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
      </div>
      <div>
        <label className="text-xs">Kod *</label>
        <input {...register('code')} className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm" />
        {errors.code && <p className="text-xs text-red-600">{errors.code.message}</p>}
      </div>
      <div>
        <label className="text-xs">Email</label>
        <input {...register('email')} className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm" />
        {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
      </div>
      <button type="submit" disabled={createMut.isPending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary">
        {createMut.isPending ? 'Kaydediliyor...' : 'Kaydet'}
      </button>
    </form>
  );
}
```

## Prisma Migration Pattern
```sql
-- 1) Yeni kolon (default ile)
ALTER TABLE "Customer" ADD COLUMN "newField" TEXT DEFAULT '...';

-- 2) Index ekle
CREATE INDEX IF NOT EXISTS "Customer_newField_idx" ON "Customer"("newField");

-- 3) NOT NULL yap (gerekirse)
ALTER TABLE "Customer" ALTER COLUMN "newField" SET NOT NULL;
```

## Error Handling Pattern

### Backend
```ts
import { NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';

if (!item) throw new NotFoundException('Kayıt bulunamadı');
if (balance < amount) throw new BadRequestException('Yetersiz bakiye');
if (!hasPermission) throw new ForbiddenException('Bu işlem için yetkiniz yok');
if (duplicateCode) throw new ConflictException('Bu kod zaten kullanılıyor');
```

### Frontend
```ts
try {
  await delMut.mutateAsync(id);
  toast.success('Silindi');
} catch (e: any) {
  toast.error(e.message ?? 'İşlem başarısız');
}
```

## Soft Delete + Reverse Movement Pattern
```ts
// 1) Orijinal kayıt soft delete
await prisma.sale.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });

// 2) Ters kayıt oluştur
await prisma.customerMovement.create({
  data: {
    tenantId, customerId, amount: -sale.grandTotal, // negatif
    type: 'RETURN',
    refType: 'Sale', refId: sale.id,
    description: 'Satış iptali'
  }
});
```
