# VERİTABANI ER DİYAGRAM (Mermaid)

Aşağıdaki diyagram `mermaid` blokları içerir. GitHub/GitLab/Notion'da otomatik render edilir; VS Code'da "Markdown Preview Mermaid Support" eklentisi ile görüntülenir.

---

## 1. ÜST DÜZEY ER

```mermaid
erDiagram
    tenants ||--o{ users : "has"
    tenants ||--o{ roles : "defines"
    tenants ||--|| tenant_settings : "has"
    tenants ||--o{ subscriptions : "subscribes"
    plans ||--o{ subscriptions : "used in"
    plans ||--o{ plan_modules : "includes"
    modules ||--o{ plan_modules : "in plan"
    modules ||--o{ tenant_modules : "overridden by"
    tenants ||--o{ tenant_modules : "has"
    roles ||--o{ role_permissions : "grants"
    permissions ||--o{ role_permissions : "granted to"
    users ||--o{ user_roles : "has"
    roles ||--o{ user_roles : "assigned"
    tenants ||--o{ user_roles : "scoped"

    tenants ||--o{ customers : "owns"
    customers ||--o{ customer_movements : "has"
    tenants ||--o{ products : "owns"
    products ||--o{ product_barcodes : "has"
    products }o--|| brands : "belongs to"
    products }o--|| product_categories : "categorized"
    tenants ||--o{ warehouses : "owns"
    products ||--o{ stock_movements : "tracks"
    warehouses ||--o{ stock_movements : "stores"

    tenants ||--o{ sales : "creates"
    customers ||--o{ sales : "buys"
    warehouses ||--o{ sales : "ships from"
    sales ||--o{ sale_items : "contains"
    products ||--o{ sale_items : "in"

    tenants ||--o{ orders : "creates"
    customers ||--o{ orders : "places"
    orders ||--o{ order_items : "contains"
    products ||--o{ order_items : "ordered"

    tenants ||--o{ collections : "receives"
    customers ||--o{ collections : "pays"
    cash_accounts ||--o{ collections : "deposited to"
    sales ||--o{ collections : "may settle"

    tenants ||--o{ cash_accounts : "owns"
    cash_accounts ||--o{ cash_movements : "tracks"

    tenants ||--o{ files : "stores"
    tenants ||--|| tenant_storage_usage : "monitors"

    audit_logs }o--|| tenants : "scoped"
    audit_logs }o--o| users : "performed by"
    security_logs }o--o| users : "by"
    import_batches ||--o{ import_errors : "produces"

    tenants ||--o{ archived_sales : "migrates from old system"
    archived_sales }o--o| customers : "links to (by external_id)"
```

---

## 2. CARI AKIŞ DETAYI (SATIŞ + TAHSİLAT)

```mermaid
flowchart LR
    A[Cari Müşteri] -->|seç| B[Satış Oluştur]
    B --> C{Satış Onay}
    C -->|Onay| D[sales INSERT]
    D --> E[sale_items INSERT]
    D --> F[customer_movement<br/>type=DEBIT amount=grand_total]
    D --> G[stock_movement<br/>type=OUT quantity=line.qty]
    D --> H[audit_log CREATE]
    C -->|İptal| I[sales.status=CANCELLED]
    I --> J[customer_movement<br/>type=CREDIT ref=SALE_CANCEL]
    I --> K[stock_movement<br/>type=IN ref=SALE_CANCEL]
    I --> L[audit_log CANCEL]

    M[Tahsilat] --> N[collections INSERT]
    N --> O[customer_movement<br/>type=CREDIT amount=paid]
    N --> P[cash_movement<br/>type=IN]
    N --> Q[audit_log CREATE]

    style F fill:#fee
    style J fill:#efe
    style G fill:#fef
    style K fill:#eef
```

---

## 3. AUTH + TENANT PIPELINE

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as NestJS API
    participant DB as PostgreSQL
    participant R2 as Cloudflare R2

    U->>FE: login(email, password)
    FE->>API: POST /auth/login
    API->>DB: SELECT user + tenant + active subscription
    API-->>FE: { accessToken, refreshToken (cookie), user, permissions, modules }
    FE->>API: GET /customers (Bearer accessToken)
    API->>API: JwtAuthGuard
    API->>API: TenantResolverMiddleware
    API->>API: TenantGuard (active?)
    API->>API: SubscriptionGuard (active?)
    API->>API: ModuleGuard (cari active?)
    API->>API: PermissionGuard (cari:read?)
    API->>DB: SELECT * FROM customers WHERE tenant_id=$1
    DB-->>API: rows
    API-->>FE: 200 { data: [...], pagination }
    API->>DB: INSERT INTO api_logs (...)
```
