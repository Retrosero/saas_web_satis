# PC Test Script - API Testleri
# PowerShell ile çalıştır

$api = "http://localhost:3000/api/v1"
$headers = @{"Content-Type"="application/json"}

Write-Host "=== PC Test Otomasyonu ===" -ForegroundColor Cyan
Write-Host "`n"

# Test 1: Login - Süper Admin
Write-Host "[1/10] Smoke - Süper Admin girişi" -ForegroundColor Yellow
try {
    $body = "{""email"":""admin@sistem.local"",""password"":""ChangeMe123!""}"
    $resp = Invoke-WebRequest -Uri "$api/auth/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    $saToken = ($resp.Content | ConvertFrom-Json).accessToken
    Write-Host "  ✅ Süper Admin giriş başarılı" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Hata: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Login - Demo Tenant Admin
Write-Host "[2/10] Smoke - Demo Tenant Admin girişi" -ForegroundColor Yellow
try {
    $body = "{""email"":""admin@demo.local"",""password"":""Demo123!""}"
    $resp = Invoke-WebRequest -Uri "$api/auth/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    $tenantToken = ($resp.Content | ConvertFrom-Json).accessToken
    $tenantId = ($resp.Content | ConvertFrom-Json).tenantId
    Write-Host "  ✅ Demo Tenant giriş başarılı" -ForegroundColor Green
    Write-Host "  Tenant ID: $tenantId" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ Hata: $($_.Exception.Message)" -ForegroundColor Red
    $tenantToken = $null
}

if (-not $tenantToken) {
    Write-Host "`nTenant token alınamadı, testler iptal." -ForegroundColor Red
    exit
}

# Test 3: Dashboard
Write-Host "[3/10] Dashboard verisi" -ForegroundColor Yellow
try {
    $headersAuth = @{"Authorization"="Bearer $tenantToken"}
    $resp = Invoke-WebRequest -Uri "$api/dashboard" -Method GET -Headers $headersAuth -UseBasicParsing
    Write-Host "  ✅ Dashboard açılıyor (HTTP $($resp.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️ Dashboard: $($_.Exception.Message)" -ForegroundColor DarkYellow
}

# Test 4: Cari listesi
Write-Host "[4/10] FAZ 6 - Cari listesi" -ForegroundColor Yellow
try {
    $resp = Invoke-WebRequest -Uri "$api/customers" -Method GET -Headers $headersAuth -UseBasicParsing
    Write-Host "  ✅ Cari listesi açılıyor (HTTP $($resp.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️ $($_.Exception.Message)" -ForegroundColor DarkYellow
}

# Test 5: Ürün listesi
Write-Host "[5/10] FAZ 7 - Ürün listesi" -ForegroundColor Yellow
try {
    $resp = Invoke-WebRequest -Uri "$api/products" -Method GET -Headers $headersAuth -UseBasicParsing
    Write-Host "  ✅ Ürün listesi açılıyor (HTTP $($resp.StatusCode))" -ForegroundColor Green
    $products = $resp.Content | ConvertFrom-Json
    Write-Host "  Toplam ürün: $($products.data.Count)" -ForegroundColor Gray
} catch {
    Write-Host "  ⚠️ $($_.Exception.Message)" -ForegroundColor DarkYellow
}

# Test 6: Yeni ürün ekleme
Write-Host "[6/10] FAZ 7 - Yeni ürün oluşturma" -ForegroundColor Yellow
try {
    $productBody = "{""name"":""Test Ürünü PC"",""sku"":""TEST-PC-$([Guid]::NewGuid().ToString().Substring(0,8))"",""unit"":""ADET"",""price"":100.00,""cost"":50.00,""vatRate"":20}"
    $resp = Invoke-WebRequest -Uri "$api/products" -Method POST -Body $productBody -ContentType "application/json" -Headers $headersAuth -UseBasicParsing
    Write-Host "  ✅ Ürün oluşturuldu (HTTP $($resp.StatusCode))" -ForegroundColor Green
    $newProduct = $resp.Content | ConvertFrom-Json
    $productId = $newProduct.id
    Write-Host "  Ürün ID: $productId" -ForegroundColor Gray
} catch {
    Write-Host "  ⚠️ $($_.Exception.Message)" -ForegroundColor DarkYellow
    $productId = $null
}

# Test 7: Ürün detay
Write-Host "[7/10] FAZ 7 - Ürün detay" -ForegroundColor Yellow
if ($productId) {
    try {
        $resp = Invoke-WebRequest -Uri "$api/products/$productId" -Method GET -Headers $headersAuth -UseBasicParsing
        Write-Host "  ✅ Ürün detay açılıyor (HTTP $($resp.StatusCode))" -ForegroundColor Green
        $productDetail = $resp.Content | ConvertFrom-Json
        Write-Host "  Ürün adı: $($productDetail.name)" -ForegroundColor Gray
    } catch {
        Write-Host "  ⚠️ $($_.Exception.Message)" -ForegroundColor DarkYellow
    }
} else {
    Write-Host "  ⏭️ Atlanıyor (ürün ID yok)" -ForegroundColor DarkYellow
}

# Test 8: Depo listesi
Write-Host "[8/10] FAZ 14 - Depo listesi" -ForegroundColor Yellow
try {
    $resp = Invoke-WebRequest -Uri "$api/warehouses" -Method GET -Headers $headersAuth -UseBasicParsing
    Write-Host "  ✅ Depo listesi açılıyor (HTTP $($resp.StatusCode))" -ForegroundColor Green
    $warehouses = $resp.Content | ConvertFrom-Json
    Write-Host "  Toplam depo: $($warehouses.data.Count)" -ForegroundColor Gray
} catch {
    Write-Host "  ⚠️ $($_.Exception.Message)" -ForegroundColor DarkYellow
}

# Test 9: Raporlar
Write-Host "[9/10] FAZ 12 - Raporlar" -ForegroundColor Yellow
try {
    $resp = Invoke-WebRequest -Uri "$api/reports" -Method GET -Headers $headersAuth -UseBasicParsing
    Write-Host "  ✅ Raporlar açılıyor (HTTP $($resp.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️ $($_.Exception.Message)" -ForegroundColor DarkYellow
}

# Test 10: Kasa listesi
Write-Host "[10/10] FAZ 11 - Kasa listesi" -ForegroundColor Yellow
try {
    $resp = Invoke-WebRequest -Uri "$api/cash/accounts" -Method GET -Headers $headersAuth -UseBasicParsing
    Write-Host "  ✅ Kasa listesi açılıyor (HTTP $($resp.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️ $($_.Exception.Message)" -ForegroundColor DarkYellow
}

Write-Host "`n=== API Testleri Tamamlandı ===" -ForegroundColor Cyan
Write-Host "Not: E2E ve tarayıcı testleri manuel olarak yapılmalıdır." -ForegroundColor Magenta