# PC Test Planı

Bu doküman, uygulamanın tarayıcı içinde hazırlanmış akışlarını normal masaüstü kullanımında doğrulamak için hazırlanmıştır. Amaç, faz bazlı kabul testlerini tek bir listede toplamak ve her yeni yayından önce aynı kontrol setini tekrar çalıştırmaktır.

## 1. Test Öncesi Hazırlık

### Ortam

- Node.js `20+`
- `pnpm 9+`
- Docker Desktop veya eşdeğeri
- Modern masaüstü tarayıcı: Chrome, Edge, Firefox

### Kurulum

```bash
pnpm install
docker compose up -d
pnpm --filter api prisma generate
pnpm dev
```

### Temel teknik kontroller

Her tam test turundan önce en az şu komutlar çalıştırılmalı:

```bash
pnpm --filter web build
pnpm --filter api build
pnpm test:web
pnpm test:api
pnpm test:e2e
```

`test:e2e` henüz eksik veya kısmi ise bu durum test raporunda açıkça not edilmeli.

## 2. Smoke Test

Her sürümde önce aşağıdaki 10 dakikalık smoke test çalıştırılmalı:

1. Giriş ekranı açılıyor mu?
2. Demo tenant admin ile giriş yapılabiliyor mu?
3. Dashboard açılıyor mu?
4. Sidebar’daki aktif modüller 404 vermeden açılıyor mu?
5. Çıkış yapınca login ekranına dönüyor mu?
6. API erişiminde global 401/403 kırılması var mı?
7. En az bir liste sayfası veri yüklüyor mu?
8. En az bir form kayıt atabiliyor mu?
9. Toast mesajları Türkçe ve anlaşılır mı?
10. Konsolda kritik runtime error var mı?

## 3. Faz Bazlı Test Matrisi

### FAZ 0-2: Mimari, DB, shared kuralları

- Multi-tenant kayıtlar başka tenant’tan görünmüyor mu?
- Soft delete yapılan kayıtlar listede kayboluyor ama DB ilişkileri kırılmıyor mu?
- Para alanlarında `Float` kaynaklı yuvarlama sapması yok mu?
- Stok ve bakiye hesapları hareket toplamından mı geliyor?
- Migration sonrası seed ve uygulama ayağa kalkıyor mu?

### FAZ 3: Auth, tenant, süper admin

- Süper admin giriş yapabiliyor mu?
- Süper admin dashboard açılıyor mu?
- Firma listesi, firma detayı, kullanıcı listesi, planlar, modüller sayfaları açılıyor mu?
- Yetkisiz kullanıcı süper admin ekranına giremeyip `403` alıyor mu?
- Refresh token ile oturum yenileme çalışıyor mu?

### FAZ 3.5: Bildirim altyapısı

- Topbar bildirim alanı açılıyor mu?
- Okunmamış bildirim sayısı güncelleniyor mu?
- Bildirim tıklanınca hedef ekrana gidiyor mu?

### FAZ 4: Tenant admin

- Abonelik, modüller, kullanıcılar, roller, firma profili ekranları açılıyor mu?
- Modül aç/kapat değişikliği oturum bazında etkisini gösteriyor mu?
- Tenant admin yalnız kendi tenant verisini yönetebiliyor mu?

### FAZ 5: Log ve audit görünümü

- Tenant logları açılıyor mu?
- Süper admin logları açılıyor mu?
- CSV export bozulmadan dosya üretiyor mu?

### FAZ 6: Cari modülü

- Cari listesi açılıyor mu?
- Yeni cari eklenebiliyor mu?
- Cari detay açılıyor mu?
- Arama, tür filtresi, durum filtresi doğru çalışıyor mu?
- Soft delete veya pasife alma sonrası kayıt tekrar yüklenince beklenen durumda mı?

### FAZ 7: Stok modülü

- Ürün listesi açılıyor mu?
- Yeni ürün oluşturulabiliyor mu?
- Ürün detayı açılıyor mu?
- Depo listesi, depo detay, depo stok, depo hareketleri açılıyor mu?
- Yeni depo eklenebiliyor mu?
- Depolar arası transfer oluşturulabiliyor mu?
- Stok hareketi sonrası ürün toplam stok değeri doğru güncelleniyor mu?
- Ürün oluştururken varsayılan birim ataması düzgün çalışıyor mu?

### FAZ 8: Satış

- Satış listesi açılıyor mu?
- Yeni satış formunda müşteri ve ürün araması çalışıyor mu?
- Satış kaydı sonrası stok çıkışı ve cari hareket oluşuyor mu?
- Satış detayı doğru toplamlarla açılıyor mu?
- İptal veya durum değişimi varsa ters hareket mantığı korunuyor mu?

### FAZ 9: Sipariş

- Sipariş listesi açılıyor mu?
- Yeni sipariş oluşturulabiliyor mu?
- Sipariş detayı açılıyor mu?
- Siparişten satışa dönüşüm akışında veri kaybı var mı?

### FAZ 10: Tahsilat

- Tahsilat listesi açılıyor mu?
- Yeni tahsilat oluşturulabiliyor mu?
- Tahsilat detayı açılıyor mu?
- Tahsilat sonrası müşteri bakiyesi ve kasa/banka hareketi doğru etkileniyor mu?

### FAZ 11: Kasa

- Kasa listesi açılıyor mu?
- Kasa detayında hareketler görünüyor mu?
- Event-sourced bakiye ile hareket toplamı tutuyor mu?

### FAZ 12 ve 31: Raporlar

- Raporlar ana sayfası açılıyor mu?
- Hazır rapor kartları veri döndürüyor mu?
- Pivot/designer ekranı açılıyor mu?
- Planlı raporlar ekranı açılıyor mu?
- Tarih aralığı değiştirilince rapor verisi güncelleniyor mu?

### FAZ 14: Depo yönetimi

- Depo oluşturma, düzenleme, transfer akışları çalışıyor mu?
- Ürün stok dağılımı depo bazında doğru mu?
- Transfer sonrası kaynak ve hedef depo miktarları tutarlı mı?

### FAZ 15: Stok sayım

- Sayım listesi açılıyor mu?
- Yeni sayım başlatılabiliyor mu?
- Barkod ekranı açılıyor mu?
- Farklar ekranı doğru hesaplıyor mu?
- Onay sonrası `ADJUST` hareketleri doğru oluşuyor mu?

### FAZ 21: İade

- İade listesi açılıyor mu?
- Yeni iade oluşturulabiliyor mu?
- İade detayı açılıyor mu?
- Onay ekranı açılıyor mu?
- İade onaylanınca stok ve müşteri hareketleri ters yönde doğru yazılıyor mu?

### FAZ 22: Banka ve POS

- Banka hesap listesi açılıyor mu?
- Yeni banka hesabı eklenebiliyor mu?
- Banka hareket listesi ve yeni hareket ekranı açılıyor mu?
- POS cihazları sayfası açılıyor mu?
- POS tahsilat ve komisyon ekranları açılıyor mu?

### FAZ 23: Portal

- Portal login açılıyor mu?
- Portal dashboard, katalog, ürün detayı, sepet, siparişler, ekstre, profil ekranları açılıyor mu?
- Portal kullanıcısı admin verilerine erişemiyor mu?

### FAZ 24: Veri taşıma

- İçe aktarma sihirbazı açılıyor mu?
- Geçmiş kayıtları görüntülenebiliyor mu?
- Hatalı dosyada kullanıcı anlaşılır hata alıyor mu?

### FAZ 25: API ve webhook

- API anahtarları ekranı açılıyor mu?
- Kullanım logları açılıyor mu?
- Webhook listesi açılıyor mu?
- Teslimat detayları açılıyor mu?
- Geçersiz webhook hedefinde hata logu oluşuyor mu?

### FAZ 26: Asistan bilgi tabanı

- Makale listesi açılıyor mu?
- Yeni makale formu açılıyor ve kayıt çalışıyor mu?
- Tool listesi açılıyor mu?

### FAZ 27: White-label

- Firma renk/marka ayarları açılıyor mu?
- Kaydedilen değişiklikler arayüze yansıyor mu?

### FAZ 28: Sistem sağlığı

- Monitoring ve error log ekranları açılıyor mu?
- En az bir sağlık metriği veri gösteriyor mu?

### FAZ 29: Fiyatlandırma ve kampanya

- Fiyat listeleri, müşteri grupları, kampanya listesi açılıyor mu?
- Yeni fiyat listesi oluşturulabiliyor mu?
- Yeni kampanya oluşturulabiliyor mu?
- Kampanya test ekranı doğru hesap yapıyor mu?

### FAZ 30: Şablonlar

- Şablon listesi açılıyor mu?
- Yeni şablon kaydı oluşturulabiliyor mu?
- Önizleme ekranı açılıyor mu?
- Varsayılan şablonlar ekranı çalışıyor mu?

### FAZ 32: Bildirim kural motoru

- Bildirim merkezi açılıyor mu?
- Kural listesi/formu açılıyor mu?
- Kanal listesi/formu açılıyor mu?
- Log ekranı açılıyor mu?

### FAZ 33: Onay akışları

- Onay ana sayfası açılıyor mu?
- Kural listesi/formu açılıyor mu?
- İstek listesi ve detay açılıyor mu?
- Onay/red sonrası kayıt durumu değişiyor mu?

### FAZ 34: Denetim

- Denetim ana sayfası açılıyor mu?
- Kural, çalıştırma, sonuç, istatistik, planlama ve log ekranları açılıyor mu?
- Denetim sonucu detayı hata vermeden açılıyor mu?

### FAZ 35: Akıllı asistan

- Chat ana sayfası açılıyor mu?
- Konfigürasyon ekranı açılıyor mu?
- Yeni mesaj gönderilebiliyor mu?
- Konuşma detayı açılıyor mu?
- İstatistik ekranı veri gösteriyor mu?

### FAZ 36: Süper admin AI gözlemlenebilirlik

- AI dashboard açılıyor mu?
- Konuşma listesi ve detay ekranı açılıyor mu?
- Eğitim verisi ekranı açılıyor mu?

### FAZ 39-43: Onboarding, demo, ziyaret, hedefler, teklif

- Onboarding sihirbazı açılıyor mu?
- Sektör şablonları açılıyor mu?
- Demo firma ekranı açılıyor mu?
- Ziyaret plan listesi, formu, detayı açılıyor mu?
- Hedef listesi ve formu açılıyor mu?
- Teklif listesi, formu, detayı açılıyor mu?

### FAZ 44-52: Operasyonel hız modülleri

- Müşteri risk ekranı ve konfigürasyonu açılıyor mu?
- Toplu işlemler ekranı açılıyor mu?
- Etiketler ekranı açılıyor mu?
- Ürün görselleri ekranı açılıyor mu?
- Segmentler ekranı açılıyor mu?
- Temizlik ekranı açılıyor mu?
- Görevler ekranı açılıyor mu?
- Destek merkezi açılıyor mu?

### FAZ 53-61: Sistem performans araçları

- Cache, queue, performans, arama, realtime, observability ekranları açılıyor mu?
- En az bir aksiyon butonu gerçekten çalışıyor mu?
- Sadece ekran açılıp açılmadığı değil, veri çekimi ve hata durumları da doğrulanıyor mu?

### FAZ HR-1: Personel

- Personel listesi açılıyor mu?
- Yeni personel eklenebiliyor mu?
- Personel detayı açılıyor mu?
- Evrak upload, durum güncelleme ve silme akışları çalışıyor mu?

### FAZ HR-2: Checklist / zimmet

- İşe giriş listesi açılıyor mu?
- İşten çıkış listesi açılıyor mu?
- Checklist detayları açılıyor mu?
- Madde durum güncelleme çalışıyor mu?
- Tamamlama ve iptal işlemleri çalışıyor mu?

### FAZ HR-3: İzin yönetimi

- İzin türleri açılıyor mu?
- İzin talep listesi açılıyor mu?
- Yeni izin talebi oluşturulabiliyor mu?
- Talep detayı açılıyor mu?
- Onay/red/iptal akışları çalışıyor mu?

### FAZ HR-4 ve sonrası: Bordro, puantaj, avans

- Bordro dönem listesi ve detay açılıyor mu?
- Bordro parametreleri ekranı açılıyor mu?
- HR567 ve HR8910 ekranları veri çekebiliyor mu?
- Puantaj senkronizasyonu ve Excel export akışları hata vermiyor mu?

## 4. Tarayıcı ve Cihaz Testleri

Her büyük sürümde en az şu kombinasyonlar test edilmeli:

- Windows + Chrome
- Windows + Edge
- macOS + Chrome veya Safari
- 1366x768 çözünürlük
- 1920x1080 çözünürlük

Kontrol başlıkları:

- Sidebar taşma yapıyor mu?
- Tablo yatay kaydırma düzgün mü?
- Form alanları görünür ve tıklanabilir mi?
- Modal ve dropdown bileşenleri viewport dışına taşıyor mu?
- Türkçe karakterler bozuk görünüyor mu?

## 5. Hata Ayıklama Önceliği

Bir sayfa bozulduğunda sıralı kontrol:

1. Route doğru mu?
2. İlgili modül sidebar’dan gerçek path’e mi gidiyor?
3. Frontend API katmanı `ApiResponse` zarfını doğru açıyor mu?
4. Form payload’ı backend DTO ile eşleşiyor mu?
5. Backend validasyon mesajı kullanıcıya okunur biçimde dönüyor mu?
6. Tenant/permission yüzünden mi hata alınıyor?
7. Konsolda runtime error veya 401/403/400 pattern’i var mı?

## 6. Test Raporu Şablonu

Her test turu sonunda şu format kullanılmalı:

```md
## Test Turu
- Tarih:
- Test eden:
- Branch / commit:
- Ortam:

## Geçenler
- ...

## Kalan Hatalar
- Sayfa / akış:
- Hata:
- Konsol / network notu:
- Tekrar adımı:

## Riskler
- ...
```

## 7. Bu Tur İçin Acil Öncelikler

Bugünkü duruma göre masaüstünde önce aşağıdakiler test edilmeli:

1. Ürün oluşturma
2. Ürün detay açılışı
3. Akıllı asistan ana sayfa, konuşma detayı, konfigürasyon
4. Zimmet / checklist listeleri ve detayları
5. Depo, banka, raporlar, bildirimler, POS, iade akışları

Bu beş grup geçmeden daha ileri fazların kabul testi güvenilir sayılmamalı.
