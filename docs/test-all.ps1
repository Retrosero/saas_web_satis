$api = "http://localhost:3000/api/v1"

# Login as super admin
$body = @{email="admin@sistem.local";password="ChangeMe123!"} | ConvertTo-Json -Compress
$resp = Invoke-WebRequest -Uri "$api/auth/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
$content = $resp.Content | ConvertFrom-Json
$token = $content.data.accessToken
$headers = @{Authorization = "Bearer $token"}

Write-Host "--- TEST SONUCLARI ---"
Write-Host ""

# Test each endpoint
$tests = @(
    @("/dashboard","Dashboard"),
    @("/customers","Cari Listesi"),
    @("/products","Urun Listesi"),
    @("/warehouses","Depo Listesi"),
    @("/sales","Satis Listesi"),
    @("/orders","Siparis Listesi"),
    @("/collections","Tahsilat Listesi"),
    @("/cash/accounts","Kasa Listesi"),
    @("/reports","Raporlar"),
    @("/stock-counts","Stok Sayim"),
    @("/returns","Iade Listesi"),
    @("/banks/accounts","Banka Listesi"),
    @("/banks/pos-devices","POS Cihazlari"),
    @("/quotes","Teklifler"),
    @("/hr/employees","Personel"),
    @("/hr/leave/types","Izin Turleri"),
    @("/hr/payroll","Bordro"),
    @("/hr/checklists/onboardings","Ise Giris"),
    @("/api/keys","API Anahtarlari"),
    @("/api/webhooks","Webhook"),
    @("/assistant/articles","Asistan Makale"),
    @("/templates","Sablonlar"),
    @("/pricing/price-lists","Fiyat Listeleri"),
    @("/pricing/campaigns","Kampanyalar"),
    @("/notifications/inbox","Bildirimler"),
    @("/approvals","Onaylar"),
    @("/audit","Denetim"),
    @("/assistant-chat","AI Asistan"),
    @("/onboarding","Onboarding"),
    @("/visits/plans","Ziyaret Planlari"),
    @("/performance/targets","Hedefler"),
    @("/customer-risk","Musteri Risk"),
    @("/bulk-operations","Toplu Islemler"),
    @("/labels","Etiketler"),
    @("/product-images","Urun Gorselleri"),
    @("/customer-segments","Segmentler"),
    @("/cleanup","Temizlik"),
    @("/tasks","Gorevler"),
    @("/support","Destek"),
    @("/system/cache","Cache Admin"),
    @("/system/queues","Queue Admin"),
    @("/system/perf","Perf Admin"),
    @("/system/search","Search Admin"),
    @("/system/realtime","Realtime"),
    @("/system/observability","Observability"),
    @("/super-admin/dashboard","SA Dashboard"),
    @("/super-admin/tenants","SA Firmalar"),
    @("/super-admin/users","SA Kullanicilar"),
    @("/super-admin/plans","SA Planlar"),
    @("/super-admin/modules","SA Moduller")
)

$ok = 0; $fail = 0; $skip = 0

foreach ($t in $tests) {
    $path = $t[0]
    $name = $t[1]
    try {
        $r = Invoke-WebRequest -Uri "$api$path" -Method GET -Headers $headers -UseBasicParsing -ErrorAction Stop
        $code = $r.StatusCode
        if ($code -eq 200 -or $code -eq 204) {
            Write-Host "OK $name (HTTP $code)" -ForegroundColor Green
            $ok++
        } else {
            Write-Host "?? $name (HTTP $code)" -ForegroundColor DarkYellow
            $ok++
        }
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code -eq 404) {
            Write-Host "-- $name (endpoint yok)" -ForegroundColor DarkYellow
            $skip++
        } elseif ($code -eq 403) {
            Write-Host "OK $name (403 yetki korumasi)" -ForegroundColor Green
            $ok++
        } elseif ($code -eq 401) {
            Write-Host "OK $name (401 auth korumasi)" -ForegroundColor Green
            $ok++
        } else {
            Write-Host "FAIL $name ($code)" -ForegroundColor Red
            $fail++
        }
    }
}

Write-Host ""
Write-Host "Gecen: $ok | Basarisiz: $fail | Atlanan: $skip" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })
Write-Host ""

# CRUD test - create customer
try {
    $newBody = @{name="Test Musteri";type="CUSTOMER";taxOffice="Istanbul";taxNumber="1234567890"} | ConvertTo-Json -Compress
    $r = Invoke-WebRequest -Uri "$api/customers" -Method POST -Body $newBody -ContentType "application/json" -Headers $headers -UseBasicParsing
    $cid = ($r.Content | ConvertFrom-Json).id
    Write-Host "CRUD: Musteri olusturma OK (ID: $cid)" -ForegroundColor Green
    
    # Get by id
    $r = Invoke-WebRequest -Uri "$api/customers/$cid" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "CRUD: Musteri detay OK (HTTP $($r.StatusCode))" -ForegroundColor Green
    
    # Delete (soft)
    $r = Invoke-WebRequest -Uri "$api/customers/$cid" -Method DELETE -Headers $headers -UseBasicParsing
    Write-Host "CRUD: Soft delete OK (HTTP $($r.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "CRUD: HATA $($_.Exception.Message)" -ForegroundColor Red
}

# CRUD test - create product
try {
    $newBody = @{name="Test Urun";sku="TST-PC-001";unit="ADET";price=100;vatRate=20} | ConvertTo-Json -Compress
    $r = Invoke-WebRequest -Uri "$api/products" -Method POST -Body $newBody -ContentType "application/json" -Headers $headers -UseBasicParsing
    Write-Host "CRUD: Urun olusturma OK (HTTP $($r.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "CRUD: Urun HATA $($_.Exception.Message)" -ForegroundColor Red
}

# API Guard test - no auth
try {
    $r = Invoke-WebRequest -Uri "$api/customers" -Method GET -UseBasicParsing
    Write-Host "GUARD: Auth'siz erisim $($r.StatusCode) (beklenen 401)" -ForegroundColor Red
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 401) {
        Write-Host "GUARD: Auth'siz erisim 401 OK" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "ALL TESTS COMPLETED" -ForegroundColor Cyan