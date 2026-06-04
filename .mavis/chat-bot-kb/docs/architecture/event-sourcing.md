# Event Sourcing — Bakiye Hesaplama

## Temel Prensip
**Bakiye SAKLANMAZ, hareketlerden hesaplanır.** Para ve stok için KRİTİK.

## Neden?
- Audit trail (her değişiklik izlenebilir)
- Raporlama tutarlılığı
- Soft delete ile uyumlu (arşiv bakiyeyi etkilemez)
- Hata düzeltme (ters kayıt)

## Hareket Tabloları

### CustomerMovement
```prisma
model CustomerMovement {
  id          String   @id @default(cuid())
  tenantId    String
  customerId  String
  amount      Decimal  // pozitif: alacak, negatif: borç
  type        CustomerMovementType  // SALE | COLLECTION | RETURN | ADJUSTMENT | OPENING
  refType     String?  // 'Sale' | 'Collection' | 'Return'
  refId       String?  // ilgili kayıt ID
  description String?
  createdById String?
  createdAt   DateTime @default(now())
  
  @@index([tenantId, customerId])
  @@index([tenantId, createdAt])
}
```

### StockMovement
```prisma
model StockMovement {
  id          String   @id @default(cuid())
  tenantId    String
  productId   String
  warehouseId String
  quantity    Decimal  // pozitif: giriş, negatif: çıkış
  type        StockMovementType  // IN | OUT | TRANSFER | ADJUSTMENT | COUNT
  refType     String?
  refId       String?
  createdAt   DateTime @default(now())
  
  @@index([tenantId, productId])
  @@index([tenantId, warehouseId])
  @@index([tenantId, createdAt])
}
```

### BankTransaction
```prisma
model BankTransaction {
  id            String   @id @default(cuid())
  tenantId      String
  bankAccountId String
  amount        Decimal
  type          BankTransactionType  // DEBIT | CREDIT
  refType       String?
  refId         String?
  createdAt     DateTime @default(now())
  
  @@index([tenantId, transactionDate])
  @@index([bankAccountId, transactionDate])
}
```

## Bakiye Sorgusu

### Müşteri Bakiyesi
```ts
const movements = await prisma.customerMovement.findMany({
  where: { tenantId, customerId, isDeleted: false }
});
const balance = movements.reduce((s, m) => s + Number(m.amount ?? 0), 0);
```

### Stok Bakiyesi
```ts
const movements = await prisma.stockMovement.findMany({
  where: { tenantId, productId, warehouseId, isDeleted: false }
});
const stock = movements.reduce((s, m) => s + Number(m.quantity ?? 0), 0);
```

### Banka Bakiyesi
```ts
const transactions = await prisma.bankTransaction.findMany({
  where: { tenantId, bankAccountId, isDeleted: false }
});
const balance = transactions.reduce((s, t) => {
  return s + (t.type === 'CREDIT' ? Number(t.amount) : -Number(t.amount));
}, 0);
```

## Hareket Oluşturma

### Satış Yapıldığında
```ts
// 1) Sale kaydı
const sale = await prisma.sale.create({ ... });
// 2) Stok çıkışı
for (const item of sale.items) {
  await prisma.stockMovement.create({
    data: { tenantId, productId: item.productId, warehouseId, quantity: -item.quantity, type: 'OUT', refType: 'Sale', refId: sale.id }
  });
}
// 3) Müşteri borç
await prisma.customerMovement.create({
  data: { tenantId, customerId, amount: sale.grandTotal, type: 'SALE', refType: 'Sale', refId: sale.id }
});
// 4) Banka alacak (peşinse)
if (sale.isPaid) {
  await prisma.bankTransaction.create({ ... });
}
```

### Tahsilat Yapıldığında
```ts
// 1) Collection kaydı
const collection = await prisma.collection.create({ ... });
// 2) Müşteri alacak (ters kayıt, negatif)
await prisma.customerMovement.create({
  data: { tenantId, customerId, amount: -collection.amount, type: 'COLLECTION', refType: 'Collection', refId: collection.id }
});
// 3) Banka borç
await prisma.bankTransaction.create({ ... });
```

## Ters Kayıt (Soft Delete / İptal)

### İade
```ts
// Sale iade → ters kayıt
await prisma.customerMovement.create({
  data: { tenantId, customerId, amount: -sale.grandTotal, type: 'RETURN', refType: 'Return', refId: returnId }
});
// Stok iade
await prisma.stockMovement.create({
  data: { ..., quantity: +item.quantity, type: 'IN', refType: 'Return', refId: returnId }
});
```

### Cleanup (FAZ 52)
- Arşivlenen kayıtlar `isDeleted=true` işaretlenir
- Bakiye sorgusu `isDeleted: false` filtrelediği için arşiv bakiyeyi ETKİLEMEZ
- Ters kayıt oluşturmaya gerek yok (silinince zaten süzülüyor)

## Açılış Bakiyesi
İlk cari oluşturulurken:
```ts
await prisma.customer.create({ ... });
await prisma.customerMovement.create({
  data: { type: 'OPENING', amount: openingBalance, description: 'Açılış bakiyesi' }
});
```

## Sık Sorulan Sorular

**S: "Bakiye cache'lenebilir mi?"**
C: Evet, Redis'te 5dk TTL ile. Update'ler invalidate edilir.

**S: "Ters kayıt (return) bakiyeyi sıfırlar mı?"**
C: Evet, pozitif + negatif hareketler birbirini götürür. Event sourcing'in doğası.

**S: "Eski hareket düzeltilirse?"**
C: Soft delete + yeni ters kayıt. Asla UPDATE on movement.

**S: "Raporlama performance?"**
C: SUM(movements) tek sorgu, index var. 10K+ müşteri/movement için 100ms altı.

**S: "Mevcut veriyi migrate nasıl?"**
C: `FAZ 24` Veri Taşıma wizard'ı. Import sırasında opening balance + hareketler oluşturulur.

**S: "Stored procedure kullanılır mı?"**
C: Hayır, Prisma transaction içinde. prisma.$transaction([...]).

**S: "Multi-currency?"**
C: Her movement'ta currency alanı. Customer birden fazla para biriminde bakiye olabilir.
