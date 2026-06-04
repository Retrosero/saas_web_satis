# VERİTABANI — 48 TABLO ÖZETİ

> **Faz:** FAZ 0 — Mimari
> **DB Engine:** PostgreSQL 16
> **ORM:** Prisma 5
> **Toplam tablo:** 48 (MVP aktif: 30, sonraki faz altyapısı: 18)

---

## 1. STANDART ALANLAR (HER TABLO)

```sql
id           TEXT PRIMARY KEY                -- cuid
tenant_id    TEXT NOT NULL REFERENCES tenants(id)   -- NULL sadece SaaS-kök tablolarda
is_active    BOOLEAN NOT NULL DEFAULT true
is_deleted   BOOLEAN NOT NULL DEFAULT false
created_at   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
updated_at   TIMESTAMP(3) NOT NULL
created_by   TEXT REFERENCES users(id)
updated_by   TEXT REFERENCES users(id)
deleted_at   TIMESTAMP(3)
deleted_by   TEXT REFERENCES users(id)
```

**ERP-entegrasyon alanları** (cari, ürün, sipariş, satış tablolarında):
```sql
source_system          TEXT     -- 'MICRO','LOGO','NETSIS','PARASUT','SAAS'
external_id            TEXT
external_updated_at    TIMESTAMP(3)
last_seen_in_source_at TIMESTAMP(3)
source_status          TEXT     -- 'ACTIVE','PASSIVE','DELETED'
sync_status            TEXT     -- 'SYNCED','PENDING','CONFLICT','IGNORED'
```

**Import/veri taşıma alanları** (ihtiyaç olan tablolarda):
```sql
import_batch_id   TEXT
import_status     TEXT
import_error      TEXT
```

---

## 2. MVP AKTİF TABLOLAR (30)

### A. SaaS Çekirdek (12)
| # | Tablo | Anahtar Kolonlar | İndeksler |
|---|-------|------------------|-----------|
| 1 | `tenants` | id, code (unique), name, working_mode (SAAS_MASTER/ERP_MASTER), status, plan_id, subscription_id, created_at | UNIQUE(code), idx_status |
| 2 | `tenant_settings` | id, tenant_id (UNIQUE), company_info JSONB, currency, tax_office, tax_number, default_warehouse_id, locale | UNIQUE(tenant_id) |
| 3 | `users` | id, tenant_id (NULL for super_admin), email (citext), phone, password_hash, full_name, avatar_url, status, last_login_at, mfa_enabled | UNIQUE(tenant_id, email), idx_tenant |
| 4 | `roles` | id, tenant_id, code, name, description, is_system | UNIQUE(tenant_id, code) |
| 5 | `permissions` | id, code (UNIQUE), module, resource, action, description | UNIQUE(code) |
| 6 | `role_permissions` | id, role_id, permission_id | UNIQUE(role_id, permission_id) |
| 7 | `user_roles` | id, user_id, role_id, tenant_id, data_scope (OWN/BRANCH/TENANT), branch_ids TEXT[] | UNIQUE(user_id, role_id, tenant_id) |
| 8 | `modules` | id, code (UNIQUE), name, category, default_route, icon, sort_order | UNIQUE(code) |
| 9 | `plans` | id, code (UNIQUE), name, monthly_price, yearly_price, currency, user_limit, branch_limit, warehouse_limit, api_key_limit, webhook_limit, storage_mb_limit | UNIQUE(code) |
| 10 | `plan_modules` | id, plan_id, module_id, is_included, custom_limit JSONB | UNIQUE(plan_id, module_id) |
| 11 | `tenant_modules` | id, tenant_id, module_id, is_active, source (plan/manual_override), limit_override JSONB, valid_until, note | UNIQUE(tenant_id, module_id) |
| 12 | `subscriptions` | id, tenant_id, plan_id, status (TRIAL/ACTIVE/PAST_DUE/CANCELLED/EXPIRED), start_at, end_at, trial_end_at, auto_renew | idx_tenant_status, idx_end_at |

### B. Cari / Stok / Operasyon (15)
| # | Tablo | Anahtar Kolonlar | İndeksler |
|---|-------|------------------|-----------|
| 13 | `customers` | id, tenant_id, code, name, type (CUSTOMER/SUPPLIER/BOTH), tax_number, tax_office, phone, email, address, city, country, currency, credit_limit, payment_term_days, is_active + ERP alanları | UNIQUE(tenant_id, code), idx_tenant_name, idx_tenant_tax |
| 14 | `customer_movements` | id, tenant_id, customer_id, type (DEBIT/CREDIT), amount, currency, ref_type, ref_id, ref_number, description, transaction_date, created_by + ERP alanları | idx_customer_date, idx_tenant_date |
| 15 | `products` | id, tenant_id, code, name, short_name, brand_id, category_id, default_warehouse_id, unit, vat_rate, base_price, cost_price, currency, min_stock, max_stock, is_active, has_barkode + ERP alanları | UNIQUE(tenant_id, code), idx_tenant_name |
| 16 | `product_barcodes` | id, tenant_id, product_id, barcode, unit, multiplier, is_primary | UNIQUE(tenant_id, barcode) |
| 17 | `product_categories` | id, tenant_id, parent_id, name, code, sort_order | idx_tenant_parent |
| 18 | `brands` | id, tenant_id, name, code, logo_url | UNIQUE(tenant_id, code) |
| 19 | `warehouses` | id, tenant_id, code, name, type, address, is_default, is_active | UNIQUE(tenant_id, code) |
| 20 | `stock_movements` | id, tenant_id, product_id, warehouse_id, type (IN/OUT/TRANSFER/ADJUST), quantity, unit_cost, total_cost, ref_type, ref_id, ref_number, transaction_date, created_by | idx_product_date, idx_tenant_date |
| 21 | `sales` | id, tenant_id, customer_id, warehouse_id, sale_number, sale_date, status (DRAFT/CONFIRMED/CANCELLED), subtotal, discount_total, vat_total, grand_total, paid_amount, balance, currency, notes, cancelled_at, cancelled_by, cancel_reason + ERP alanları | UNIQUE(tenant_id, sale_number), idx_customer_date, idx_tenant_date_status |
| 22 | `sale_items` | id, tenant_id, sale_id, product_id, quantity, unit_price, discount_rate, discount_amount, vat_rate, vat_amount, line_total, notes | idx_sale |
| 23 | `orders` | id, tenant_id, customer_id, warehouse_id, order_number, order_date, delivery_date, status (DRAFT/CONFIRMED/PREPARING/SHIPPED/DELIVERED/CANCELLED/CLOSED), subtotal, vat_total, grand_total, notes + ERP alanları | UNIQUE(tenant_id, order_number), idx_customer_date, idx_tenant_status |
| 24 | `order_items` | id, tenant_id, order_id, product_id, quantity, unit_price, vat_rate, line_total, delivered_quantity | idx_order |
| 25 | `collections` | id, tenant_id, customer_id, cash_account_id, collection_number, collection_date, amount, payment_type (CASH/CARD/BANK/EFT/CHECK/OTHER), currency, ref_sale_id, notes + ERP alanları | UNIQUE(tenant_id, collection_number), idx_customer_date |
| 26 | `cash_accounts` | id, tenant_id, code, name, type (CASH/BANK/POS), currency, opening_balance, current_balance (calculated), is_default, is_active | UNIQUE(tenant_id, code) |
| 27 | `cash_movements` | id, tenant_id, cash_account_id, type (IN/OUT/TRANSFER), amount, currency, ref_type, ref_id, ref_number, description, transaction_date, created_by | idx_account_date |
| 28 | `bank_accounts` | id, tenant_id, code, name, bank_name, iban, currency, opening_balance, is_active | UNIQUE(tenant_id, code) |
| 29 | `payment_methods` | id, tenant_id, code, name, type, is_active | UNIQUE(tenant_id, code) |
| 30 | `units` | id, tenant_id, code, name | UNIQUE(tenant_id, code) |

### C. Log (3 — MVP aktif)
| # | Tablo | Anahtar Kolonlar | İndeksler |
|---|-------|------------------|-----------|
| 31 | `audit_logs` | id, tenant_id, user_id, module, action, entity_type, entity_id, old_values JSONB, new_values JSONB, changed_fields TEXT[], ip_address, user_agent, request_id, risk_level, created_at | idx_tenant_user, idx_tenant_date, idx_entity, idx_risk |
| 32 | `error_logs` | id, tenant_id, user_id, level, message, stack_trace, path, method, status_code, request_id, created_at | idx_tenant_date, idx_level |
| 33 | `security_logs` | id, tenant_id, user_id, event (LOGIN_SUCCESS/LOGIN_FAIL/LOGOUT/TOKEN_REFRESH/PASSWORD_RESET/PERMISSION_DENIED/SUSPICIOUS_IP), ip_address, user_agent, risk_level, created_at | idx_tenant_date, idx_event |

### D. Import (3)
| # | Tablo | Anahtar Kolonlar | İndeksler |
|---|-------|------------------|-----------|
| 34 | `import_batches` | id, tenant_id, user_id, type (CUSTOMER/PRODUCT/PRICE), file_name, file_key, total_rows, success_count, error_count, status (PARSING/PROCESSING/COMPLETED/FAILED), started_at, completed_at | idx_tenant_status |
| 35 | `import_errors` | id, batch_id, row_number, row_data JSONB, error_message, field_name | idx_batch |
| 36 | `archived_sales` | id, tenant_id, customer_external_id, customer_name, sale_date, sale_number, grand_total, currency, source_system, raw_data JSONB | idx_tenant_date, idx_customer_ext |

### E. Storage (2 — MVP aktif)
| # | Tablo | Anahtar Kolonlar | İndeksler |
|---|-------|------------------|-----------|
| 37 | `files` | id, tenant_id, owner_user_id, module, entity_type, entity_id, key (R2 path), original_name, mime_type, size_bytes, checksum, visibility, uploaded_at, deleted_at | UNIQUE(key), idx_tenant_module, idx_entity |
| 38 | `tenant_storage_usage` | tenant_id (PK), used_bytes, file_count, last_updated_at | PK |

---

## 3. SONRAKİ FAZ ALTYAPISI (18 tablo)

| # | Tablo | Kullanım | Nereden |
|---|-------|----------|---------|
| 39 | `bank_movements` | Banka hareketleri | Faz sonrası |
| 40 | `bank_reconciliations` | Banka mutabakat | Faz sonrası |
| 41 | `pos_devices` | POS cihaz tanımları | Faz sonrası |
| 42 | `stock_counts` | Sayım başlık | Faz sonrası |
| 43 | `stock_count_items` | Sayım kalemleri | Faz sonrası |
| 44 | `stock_transfers` | Depo transferi | Faz sonrası |
| 45 | `returns` | İade başlık | Faz sonrası |
| 46 | `return_items` | İade kalemleri | Faz sonrası |
| 47 | `hr_employees` | Personel | İK fazı |
| 48 | `hr_employee_documents` | Personel evrakları | İK fazı |
| 49 | `assignments` (zimmet) | Zimmet | İK fazı |
| 50 | `service_tickets` | Servis/bakım | Servis fazı |
| 51 | `api_logs` | API istek logları | Performans fazı |
| 52 | `system_alerts` | Süper admin uyarıları | Performans fazı |
| 53 | `archived_sale_items` | Arşiv satır | Veri taşıma |
| 54 | `assistant_knowledge_base` | Asistan yardım | Asistan fazı |
| 55 | `assistant_tools` | Asistan tool | Asistan fazı |
| 56 | `assistant_question_logs` | Asistan soruları | Asistan fazı |
| 57 | `api_keys` | Public API anahtarları | Public API |
| 58 | `api_key_permissions` | API key izinleri | Public API |
| 59 | `webhook_endpoints` | Webhook URL'ler | Public API |
| 60 | `webhook_events` | Webhook event tipleri | Public API |
| 61 | `webhook_delivery_logs` | Webhook teslimat | Public API |
| 62 | `tenant_storage_limits` | Paket kotaları (plan) | Planlar zaten `plans.storage_mb_limit` ile — gerekirse ayrı tablo | Operasyonel |

**Not:** Toplam MVP'de 30, altyapı 18 → bugün şemada bulunması gereken **48 tablo**. Prisma'da hepsi model olarak bulunur, kullanılmayanlar `// @unused` notu ile bırakılır.

---

## 4. ÖNEMLİ TİCARİ KURALLAR (DB SEVİYESİNDE)

### 4.1 Bakiye / Stok Miktarı
- `customers` tablosunda **`current_balance` kolonu YOK**. Bakiye `customer_movements` tablosundan her seferinde `SUM(...) WHERE tenant_id=... AND customer_id=...` ile hesaplanır.
- Aynı şekilde `products.current_stock` YOK → `stock_movements`'tan hesaplanır.
- Raporlama için materialized view (gerektiğinde):
  ```sql
  CREATE MATERIALIZED VIEW mv_customer_balance AS
    SELECT tenant_id, customer_id, SUM(CASE WHEN type='DEBIT' THEN amount ELSE -amount END) AS balance
    FROM customer_movements WHERE NOT is_deleted
    GROUP BY tenant_id, customer_id;
  ```
- `kasa.current_balance` de hareketlerden hesaplanır.

### 4.2 Satış İptal/İade
- `sales.status = CANCELLED` + `cancelled_at` + `cancelled_by` + `cancel_reason`.
- İptal edildiğinde **ters hareket** oluşturulur (`customer_movements` ve `stock_movements`'ta `ref_type='SALE_CANCEL'`).
- Orijinal kayıt `is_deleted` olmaz; **geçmişe dokunulmaz**.
- Bu sayede raporlar her zaman orijinal veriden beslenir.

### 4.3 ERP Veri Karışımı (ERP_MASTER modunda)
- `customers.source_status = 'DELETED'` olanlar web listelerde **görünmez** ama DB'de kalır.
- `is_active = false` olanlar web'de gizlenir.
- Fiziksel silme yok; sadece `is_deleted=true` veya `source_status='DELETED'`.

### 4.4 Tenant İzolasyonu
- Her tablo `tenant_id` ile başlar.
- **Repository katmanı** her sorguda `where: { tenantId: ctx.tenantId }` zorunlu kılar.
- Prisma middleware (global) her `find/update/delete` çağrısında tenant filtresi ekler (defense in depth).
- **Public tablolar** (sadece `tenants`, `modules`, `plans`, `permissions`, `roles`'deki sistem rolleri): `tenant_id NULL` olabilir.

---

## 5. INDEX STRATEJİSİ ÖZETİ

```sql
-- Zorunlu (her tenant'lı tablo)
CREATE INDEX idx_x_tenant ON x(tenant_id);
CREATE INDEX idx_x_tenant_active ON x(tenant_id) WHERE is_deleted = false;

-- Tarih bazlı raporlar
CREATE INDEX idx_x_tenant_date ON x(tenant_id, created_at DESC);

-- Soft-delete + aktif
CREATE INDEX idx_x_tenant_alive ON x(tenant_id, is_active) WHERE is_deleted = false;

-- Tenant kapsamında tekil
CREATE UNIQUE INDEX ux_x_tenant_code ON x(tenant_id, code);

-- Raporlama (cari/stok/satış)
CREATE INDEX idx_sales_tenant_customer_date ON sales(tenant_id, customer_id, sale_date DESC);
CREATE INDEX idx_stock_movements_tenant_product_date ON stock_movements(tenant_id, product_id, transaction_date DESC);
CREATE INDEX idx_customer_movements_tenant_customer_date ON customer_movements(tenant_id, customer_id, transaction_date DESC);
```

---

## 6. PERFORMANS NOTLARI

- **N+1 sorgu** riski: `sale_items` ve `order_items` her zaman `include` ile birlikte çekilir.
- **Sayfalama**: Cursor-based (keyset) — büyük veri için offset'ten hızlı.
- **Aggregate (bakiye, stok)**: Materialized view + 5 dakikada bir refresh (cron) MVP için yeterli; anlık ihtiyaç olduğunda doğrudan SUM.
- **Connection pool**: Prisma `?pgbouncer=true` ve pool size 20-50.
- **Read replica** (ileride): Raporlar replica'dan.

---

## 7. GÖRSEL DİYAGRAM (MERMAID)

Detay için: [`02-schema-diagram.md`](./02-schema-diagram.md). Aşağıda basit ER ilişki özeti:

```
tenants 1───* users
tenants 1───* roles
tenants 1───* subscriptions *───1 plans
tenants 1───* tenant_modules *───1 modules
plans   1───* plan_modules *───1 modules
roles   *───* permissions (via role_permissions)
users   *───* roles (via user_roles)

tenants 1───* customers       1───* customer_movements
tenants 1───* products        1───* product_barcodes
tenants 1───* product_categories
tenants 1───* brands
tenants 1───* warehouses
tenants 1───* stock_movements (ref: products, warehouses)
tenants 1───* sales           1───* sale_items (ref: products)
tenants 1───* orders          1───* order_items
tenants 1───* collections     (ref: customers, cash_accounts, sales)
tenants 1───* cash_accounts   1───* cash_movements
tenants 1───* bank_accounts
tenants 1───* files
tenants 1───1 tenant_storage_usage

audit_logs  *───1 tenants
audit_logs  *───1 users
error_logs  *───1 tenants
security_logs *───1 users
import_batches 1───* import_errors
archived_sales  *───1 customers (by external_id)
```
