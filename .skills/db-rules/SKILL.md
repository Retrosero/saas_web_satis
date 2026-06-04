name: db-rules
description: Prisma + PostgreSQL kuralları. Schema, migration, index, soft delete, event sourcing.
when_to_use: >
  Yeni model eklerken veya schema değiştirirken.
  Migration yazarken.
  Sorgu optimizasyonu yaparken.
  Multi-tenant mimari kararlarında.

rules:
  multi_tenant:
    zorunlu: "HER tablo tenantId String alanına sahip (zorunlu, FK Tenant)"
    index_baslangici: "@@index([tenantId, isDeleted]) en az"
    sorgu: "Her sorguda where: { tenantId, isDeleted: false }"
    asla: "Global sorgu ASLA (tüm tenant'ları sızdırır)"

  soft_delete:
    pattern: |
      isDeleted  Boolean  @default(false)
      deletedAt  DateTime?
    zorunlu_yerler: "Customer, Sale, Order, Quote, Invoice, BankTransaction, Product vs. — para/stok içeren her şey"
    neden: "Fiziksel silme YOK. Audit + geri alma + rapor tutarlılığı."
    ters_kayit: "Silme yerine ters kayıt (reverse movement) oluştur"

  event_sourcing:
    pattern: |
      Müşteri bakiyesi: CustomerMovement (her harekette + veya -)
      Stok bakiyesi: StockMovement (her IN/OUT)
      Bakiye sorgusu: SUM(movements) → hesapla, SAKLAMA
    tablolar:
      - CustomerMovement (tenantId, customerId, amount, type, refType, refId)
      - StockMovement (tenantId, productId, warehouseId, quantity, type, refType, refId)
      - BankTransaction (tenantId, bankAccountId, amount, type, refType, refId)
    asla: "balance alanı güncelleme — her zaman hareketten hesapla"

  enums:
    multi_line: "enum X { A B C } TEK SATIR parse hatası verir. Multi-line ZORUNLU:"
      example: |
        enum QuoteStatus {
          DRAFT
          SENT
          ACCEPTED
        }
    konum: "packages/shared/src/enums/{domain}.enum.ts"
    import: "Backend ve frontend'de '@saas/shared'tan import et"

  schema_format:
    field_sirasi: "id, tenantId, ... alanlar, createdAt, updatedAt, isDeleted, deletedAt"
    types:
      - id: "String @id @default(cuid())"
      - tenantId: "String (FK Tenant)"
      - money: "Decimal (asla Float)"
      - date: "DateTime"
      - status: "enum"
      - json: "Json"
      - soft: "Boolean @default(false)"
    relations: "@relation(fields: [xxxId], references: [id], onDelete: Cascade veya Restrict)"
    unique: "@@unique([tenantId, code]) — code tenant içinde unique"

  migration:
    naming: "apps/api/prisma/migrations/{YYYYMMDDHHMMSS}_{name}/migration.sql"
    yazma: "Manuel yaz. prisma migrate dev ASLA. prisma db push ASLA prod'da."
    pattern: |
      -- Önce yeni kolon (default ile)
      ALTER TABLE "X" ADD COLUMN "newCol" TEXT DEFAULT '...';
      -- Sonra veri taşı (varsa)
      -- Sonra eski kolon sil (varsa)
      -- Index ekle
      CREATE INDEX IF NOT EXISTS "X_newCol_idx" ON "X"("newCol");
    not_null: "Yeni NOT NULL kolon eklerken default değer ZORUNLU"
    rollback: "Geri alma migration'ı yaz (down.sql veya yeni migration ile ters)"

  index_stratejisi:
    listeleme: "@@index([tenantId, isDeleted, createdAt(sort: Desc)]) — liste sayfaları için"
    filtre: "@@index([tenantId, status]) — status filtreli listeler"
    lookup: "@@index([tenantId, code]) — code ile bulma"
    partial: "WHERE isDeleted = false — soft delete'leri atla"
    jsonb: "USING GIN — metadata filtreleme"
    asla: "Her kolona ayrı index — composite tercih et"

  performans:
    n_plus_1: "include ile eager load. for döngüsünde findUnique ASLA."
    pagination: "skip + take (cursor-based daha iyi ama skip yeterli)"
    transaction: "Çoklu yazma $transaction([...])"
    raw_sql: "Sadece çok kritik performans. Açıklayıcı yorum yaz."

  common_pitfalls:
    - "Float para birimi → Decimal kullan"
    - "tenantId eksik → multi-tenant kaçağı, tüm tenant'ları sızdırır"
    - "isDeleted filter unutulmuş → soft delete'leri gösteriyor"
    - "Migration'da NOT NULL default'suz → DB hatası"
    - "Tek satır enum → multi-line yap"
    - "Index olmadan sık sorgu → full table scan"
    - "balance alanı güncelleniyor → event sourcing kullan, SUM hesapla"
