Sen kıdemli bir SaaS ürün mimarı, full-stack geliştirici, frontend mimarı, backend geliştirici, veritabanı mimarı ve proje orkestratörü gibi davran.

Bu projede web tabanlı, çok firmalı, modüler, paket bazlı satılabilir bir SaaS işletme yönetim uygulaması geliştirilecek.

Uygulama %100 Türkçe olacak.
Tüm menüler, butonlar, formlar, uyarılar, hata mesajları, validasyon mesajları, boş veri ekranları, tablo başlıkları ve sistem içi açıklamalar Türkçe olacak.
Kod tarafında değişken/fonksiyon isimleri İngilizce olabilir; fakat kullanıcıya görünen her metin Türkçe olmalıdır.

==================================================

1. # TASARIM KAYNAĞI VE FRONTEND KURALI

Projede frontend tasarımları ayrıca verilecektir.

MiniMax, sayfa tasarımlarını proje içinde bulunan:

sayfatasarimlari/

klasöründen alacak ve sistemde bu tasarımları referans alarak uygulayacaktır.

Bu klasördeki tasarımlar frontend için ana görsel referans kabul edilecektir.

Kurallar:

- sayfatasarimlari klasöründeki tasarımları incele.
- Layout, renk, boşluk, buton, tablo, kart, form, modal ve genel kullanıcı deneyimini bu tasarımlara göre uygula.
- Tasarımları birebir bozma.
- Eğer tasarımda eksik sayfa varsa mevcut tasarım diline uygun şekilde yeni sayfa üret.
- Her yeni sayfa aynı tasarım sistemiyle uyumlu olmalı.
- Uygulamada farklı modüller farklı tasarım diliyle yapılmamalı.
- Tüm ekranlar ortak layout ve ortak component sistemiyle geliştirilmelidir.

Frontend tasarım ilkeleri:

- Modern
- Sade
- Kurumsal
- Mobil/tablet uyumlu
- PWA’ya uygun
- ERP/SaaS panel yapısına uygun
- Hızlı kullanılabilir
- Saha satış personelinin kolay anlayacağı şekilde sade

# ================================================== 2. COMPONENT MİMARİSİ

Projede mutlaka güçlü bir component yapısı kurulacak.

Her sayfa sıfırdan ayrı ayrı kodlanmayacak.
Tekrarlayan alanlar reusable component olarak hazırlanacak.

Zorunlu component grupları:

1. Layout componentleri

- AppLayout
- AuthLayout
- DashboardLayout
- Sidebar
- Topbar
- MobileBottomNav
- PageHeader
- Breadcrumb
- ModuleGuard
- PermissionGuard

2. Form componentleri

- TextInput
- NumberInput
- SelectInput
- DateInput
- CurrencyInput
- SearchInput
- TextareaInput
- CheckboxInput
- FormSection
- FormActions
- ValidationMessage

3. Liste / tablo componentleri

- DataTable
- DataTableHeader
- DataTableFilter
- DataTablePagination
- DataTableActions
- EmptyState
- LoadingState
- ErrorState
- MobileCardList

4. Kart componentleri

- StatCard
- ModuleCard
- InfoCard
- AlertCard
- CustomerCard
- ProductCard
- ReportCard

5. Modal / drawer componentleri

- ConfirmModal
- FormModal
- DetailDrawer
- FilterDrawer
- ActionSheet

6. İşlem componentleri

- SaveButton
- DeleteButton
- CancelButton
- EditButton
- ExportButton
- ImportButton
- PrintButton
- StatusBadge
- SyncStatusBadge
- ModuleStatusBadge

7. Bildirim componentleri

- Toast
- AlertBox
- NotificationItem
- SystemWarningBanner

8. Dosya componentleri

- FileUploader
- ImageUploader
- FilePreview
- StorageUsageBar

9. Yetki componentleri

- RoleSelector
- PermissionMatrix
- UserAccessScopeSelector

10. SaaS componentleri

- PlanCard
- ModuleToggle
- TenantStatusBadge
- SubscriptionStatusCard
- StorageLimitCard

Component kuralları:

- Componentler modüler olmalı.
- Tekrarlayan kod yazılmamalı.
- Her component TypeScript ile tip güvenli hazırlanmalı.
- Componentler mümkün olduğunca generic olmalı.
- Sayfalar componentleri kullanarak oluşturulmalı.
- Ortak tablo, form, modal ve filtre yapıları tekrar kullanılmalı.
- İleride yeni modül eklenince aynı component sistemiyle hızlıca geliştirilebilmeli.

# ================================================== 3. TEKNOLOJİ ÖNERİSİ

Frontend:

- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Query
- Zustand veya Redux Toolkit
- React Hook Form
- Zod validation
- PWA uyumu

Backend:

- Node.js / NestJS tercih edilir
- Alternatif olarak Laravel kullanılabilir
- REST API mimarisi
- Modüler service/repository yapısı

Database:

- PostgreSQL veya MySQL
- Migration zorunlu
- Tenant kontrollü veri yapısı

Storage:

- Cloudflare R2
- Dosyalar/görseller R2 üzerinde tutulacak
- Veritabanında sadece dosya yolu ve metadata tutulacak

# ================================================== 4. TEMEL ÜRÜN MANTIĞI

Sistem çok firmalı SaaS mimarisinde olacak.

Her firma tenant olarak ayrılacak.

Her firma sadece kendisine tanımlanan modülleri görecek ve kullanacak.

Tüm modüller tenant kontrollü olacak.

Modüller ayrı ayrı satılabilir olacak.

Paket sistemi olacak:

- Başlangıç Paketi
- Standart Paket
- Profesyonel Paket
- Kurumsal Paket
- Firmaya özel paket

Her pakete farklı modüller, kullanıcı limitleri, şube limitleri, depo limitleri, API/webhook limitleri ve Cloudflare R2 dosya depolama limiti tanımlanabilecek.

Veritabanı GB limiti ilk aşamada uygulanmayacak.
Sadece dosya, belge ve görsel kullanımı için Cloudflare R2 storage tarafında tenant/paket bazlı limit uygulanacak.

# ================================================== 5. ÇALIŞMA MODLARI

Sistemde iki farklı çalışma modu desteklenecek:

1. SAAS_MASTER

Yerel muhasebe programı kullanmayan firmalar için ana veri kaynağı SaaS veritabanıdır.

Cari, stok, fiyat, bakiye, satış, tahsilat ve raporlar SaaS içinde yönetilir.

2. ERP_MASTER

Mikro, Logo, Netsis, Paraşüt gibi yerel/harici muhasebe programı kullanan firmalar için ana veri kaynağı ERP’dir.

SaaS, ERP’den gelen cari, stok, fiyat, bakiye gibi bilgileri gösterir.

SaaS operasyon paneli gibi çalışır.

İleride adaptör aracılığıyla ERP ile senkron çalışır.

ERP_MASTER modunda:

- ERP’de aktif olmayan cari/stok web operasyon ekranlarında görünmez.
- Web tarafında fiziksel silme yapılmaz.
- Kayıt pasif/arşiv referansı olarak korunur.
- Geçmiş satış/sipariş/tahsilat/log kayıtlarının bağlantısı bozulmaz.

# ================================================== 6. ANA MODÜLLER

Sistem ileride şu modülleri destekleyebilecek mimaride olacak:

- Cari Modülü
- Stok Modülü
- Satış Modülü
- Sipariş Modülü
- Tahsilat Modülü
- Kasa Modülü
- Banka Modülü
- POS Modülü
- Depo Modülü
- Stok Sayım Modülü
- İade Modülü
- Raporlar Modülü
- İK / Personel Modülü
- Zimmet Modülü
- Servis / Bakım Modülü
- Bayi / Müşteri Portalı
- API & Webhook Modülü
- ERP Entegrasyon Modülü
- Veri Taşıma / Geçiş Modülü
- Log & Audit Modülü
- Destek Merkezi
- Bildirim / Görev Modülü
- Akıllı Asistan Bilgi Tabanı Altyapısı

İlk MVP’de tüm modüller kodlanmayacak.
Ancak sistem mimarisi bu modüller sonradan eklenebilecek şekilde hazırlanacak.

# ================================================== 7. İLK MVP KAPSAMI

İlk fazda geliştirilecek temel yapı:

1. Auth sistemi

- Giriş
- Çıkış
- Kullanıcı oturumu
- JWT / refresh token
- Şifre güvenliği

2. Tenant sistemi

- Firma oluşturma
- Firma ayarları
- Tenant izolasyonu
- Tenant aktif/pasif durumu

3. Süper admin paneli

- Firmaları görme
- Firma ekleme/düzenleme
- Firma aktif/pasif yapma
- Paket atama
- Modül açma/kapatma
- Kullanıcı limitlerini görme
- Storage kullanımını görme
- Sistem loglarını görme

4. Paket ve modül sistemi

- Modül tanımları
- Paket tanımları
- Paket-modül eşleştirme
- Firma bazlı özel modül açma/kapatma

5. Kullanıcı / rol / yetki sistemi

- Kullanıcı oluşturma
- Rol oluşturma
- Yetki atama
- Modül yetkisi
- Sayfa yetkisi
- Buton/işlem yetkisi
- Veri erişim yetkisi

6. Cari modülü

- Cari liste
- Cari ekleme
- Cari düzenleme
- Cari detay
- Cari bakiye alanı
- Cari hareket altyapısı

7. Stok modülü

- Ürün liste
- Ürün ekleme
- Ürün düzenleme
- Barkod
- Marka
- Kategori
- Fiyat
- Stok miktarı
- Ürün görseli
- Cloudflare R2 dosya/görsel altyapısı

8. Satış modülü

- Müşteri seçimi
- Ürün seçimi
- Sepet mantığı
- Adet/fiyat/iskonto
- Satış kaydı
- Satış kalemleri
- Stok ve cari hareket altyapısı

9. Sipariş modülü

- Sipariş oluşturma
- Sipariş listesi
- Sipariş durumları
- Sipariş kalemleri

10. Tahsilat modülü

- Cari seçimi
- Tutar
- Ödeme tipi
- Kasa seçimi
- Tahsilat kaydı
- Cari hareket etkisi

11. Kasa modülü

- Kasa tanımları
- Kasa hareketleri
- Tahsilat bağlantısı

12. Temel raporlar

- Günlük satış
- Cari bakiye listesi
- Stok listesi
- Tahsilat listesi

13. Excel aktarım

- Cari import
- Stok import
- Fiyat import
- Ön izleme
- Hata kontrolü

14. Log & Audit sistemi

- Kullanıcı işlemleri
- Kritik veri değişiklikleri
- Hata logları
- Güvenlik logları
- API logları
- Süper admin log merkezi

15. PWA uyumlu responsive arayüz

- Mobil/tablet uyumlu
- Web panel
- Saha satışa uygun temel ekranlar

# ================================================== 8. GELİŞTİRME SIRASI

Projeyi şu sırayla geliştir:

1. sayfatasarimlari klasörünü incele
2. Tasarım sistemini çıkar
3. Component mimarisini oluştur
4. Proje analizi ve mimari doküman hazırla
5. Veritabanı şemasını hazırla
6. Migration sistemini kur
7. Backend iskeletini kur
8. Frontend iskeletini kur
9. Auth sistemini geliştir
10. Tenant sistemini geliştir
11. Süper admin panelini geliştir
12. Paket/modül sistemini geliştir
13. Rol/permission sistemini geliştir
14. Log altyapısını geliştir
15. Cari modülünü geliştir
16. Stok modülünü geliştir
17. Cloudflare R2 dosya altyapısını geliştir
18. Satış modülünü geliştir
19. Sipariş modülünü geliştir
20. Tahsilat modülünü geliştir
21. Kasa modülünü geliştir
22. Temel raporları geliştir
23. Excel import sistemini geliştir
24. Storage kullanım takibini geliştir
25. PWA/responsive iyileştirme yap
26. Test ve hata düzeltme yap
27. Sonraki fazlar için altyapı notlarını hazırla

Kod yazarken her fazı küçük parçalara böl.
Bir faz bitmeden diğerine geçme.

Her faz sonunda:

- Ne yapıldı?
- Hangi dosyalar değişti?
- Hangi componentler oluşturuldu?
- Hangi migration eklendi?
- Hangi API endpointleri eklendi?
- Hangi testler yapılmalı?
- Hangi ajanların kontrolünden geçti?
  raporla.

# ================================================== 9. AJAN TAKIMI

Projede aşağıdaki ajan takımı kullanılacak.

Her ajan kendi alanını kontrol edecek.

1. Proje Mimarı / Orkestratör Ajan

- Genel mimariyi yönetir.
- Fazları sıralar.
- Modüller arası bağımlılıkları kontrol eder.
- MVP kapsamının şişmesini önler.

2. Frontend Mimari & Component Ajanı

- sayfatasarimlari klasöründeki tasarımları analiz eder.
- Ortak component sistemini kurar.
- Tüm sayfaların aynı tasarım diliyle ilerlemesini sağlar.
- Tekrarlayan kodları componentlere böler.
- Responsive ve PWA uyumluluğunu kontrol eder.

3. Veritabanı & Migration Ajanı

- Tüm tablo yapısını kontrol eder.
- tenant_id zorunluluğunu denetler.
- Migration olmadan tablo değişikliğine izin vermez.
- Foreign key, index, unique constraint ve soft delete yapısını kontrol eder.

4. Muhasebe Mantığı Ajanı

- Cari, stok, satış, tahsilat, kasa, iade ve siparişlerin hesap mantığını kontrol eder.
- Borç/alacak yönü doğru mu denetler.
- Stok giriş/çıkış yönü doğru mu denetler.
- Silme yerine iptal/ters kayıt mantığını kontrol eder.

5. API / Backend Ajanı

- Backend servis mimarisini kurar.
- Controller, service, repository katmanlarını düzenler.
- API response standardını belirler.
- Validation, error handling, transaction ve pagination yapısını kontrol eder.

6. Güvenlik & Yetki Ajanı

- RBAC/permission sistemini kontrol eder.
- Kullanıcının başka tenant verisine erişmesini engeller.
- Şifre, token, API key ve dosya erişim güvenliğini kontrol eder.

7. Modül & Paket Ajanı

- Modüllerin tenant bazlı açılıp kapatılmasını kontrol eder.
- Paket sistemini denetler.
- Modül kapalıyken menü, sayfa ve API erişiminin engellendiğini kontrol eder.

8. Log & Audit Ajanı

- Her kritik işlemin loglanmasını sağlar.
- Eski değer/yeni değer kaydı var mı kontrol eder.
- Hata logları yeterli mi denetler.
- Süper admin panelinden hatalar izlenebilir mi kontrol eder.

9. Test & QA Ajanı

- Her fazdan sonra test senaryosu üretir.
- Yetkisiz erişim testleri yapar.
- Tenant veri karışımı testi yapar.
- Modül kapalıyken erişim testi yapar.
- Muhasebesel işlem testleri yapar.

10. Raporlama & Performans Ajanı

- Raporlar için veri modeli yeterli mi kontrol eder.
- Sorguların performansını izler.
- Gerekli indexleri önerir.
- Dashboard ve raporların yavaşlamasını engeller.

11. Entegrasyon Ajanı

- ERP adaptörlerine uygun altyapıyı kontrol eder.
- Mikro, Logo, Netsis, Paraşüt gibi sistemlerle ileride senkron çalışmaya uygun alanların bırakıldığını denetler.
- external_id, source_system, sync_status gibi alanların doğru kullanıldığını kontrol eder.

12. Veri Taşıma / Geçiş Ajanı

- Excel/Mikro/Logo/Netsis/Paraşüt şablonları için mapping mantığını tasarlar.
- Cari/stok/fiyat/bakiye aktarımını denetler.
- Satış geçmişlerinin sadece arşiv amaçlı alınmasını kontrol eder.

13. Akıllı Asistan & Bilgi Tabanı Ajanı

- Akıllı asistan ilk fazda kodlanmayacak.
- Ancak her modül, sayfa ve buton için yardım açıklaması altyapısını hazırlar.
- İleride asistanın kullanacağı bilgi tabanı yapısını planlar.

14. Storage / Dosya Yönetimi Ajanı

- Cloudflare R2 dosya yönetimini kontrol eder.
- Tenant bazlı dosya yolu ve kullanım kotasını denetler.
- Dosya erişiminde tenant kontrolü yapar.

# ================================================== 10. VERİTABANI TEMEL KURALLARI

Tüm ana tablolarda mümkünse şu alanlar olacak:

- id
- tenant_id
- created_at
- updated_at
- created_by
- updated_by
- deleted_at
- deleted_by
- is_active
- is_deleted

ERP entegrasyonuna açık tablolarda ek olarak:

- source_system
- external_id
- external_updated_at
- last_seen_in_source_at
- source_status
- sync_status

Import/veri taşıma için:

- import_batch_id
- import_status
- import_error

# ================================================== 11. TEMEL TABLO GRUPLARI

SaaS çekirdek:

- tenants
- tenant_settings
- users
- roles
- permissions
- role_permissions
- user_roles
- modules
- plans
- plan_modules
- tenant_modules
- subscriptions

Cari/stok/satış:

- customers
- customer_movements
- products
- product_barcodes
- product_categories
- brands
- warehouses
- stock_movements
- sales
- sale_items
- orders
- order_items
- collections
- cash_accounts
- cash_movements

Log:

- audit_logs
- error_logs
- security_logs
- api_logs
- system_alerts

Import:

- import_batches
- import_errors
- archived_sales
- archived_sale_items

Storage:

- files
- tenant_storage_limits
- tenant_storage_usage

Assistant altyapısı:

- assistant_knowledge_base
- assistant_tools
- assistant_question_logs

API/Webhook:

- api_keys
- api_key_permissions
- webhook_endpoints
- webhook_events
- webhook_delivery_logs

# ================================================== 12. API MİMARİSİ

API ikiye ayrılacak:

1. Internal API
   Web panel, PWA ve ileride Windows/mobil istemciler kullanır.

2. Public API
   Müşterinin dış sistemleri, bayi portalları, entegrasyonlar ve webhooklar için kullanılır.

İlk MVP’de public API tamamen açılmayabilir.
Ama mimari buna hazır olmalı.

Her API isteğinde şu kontroller zorunludur:

- Auth kontrolü
- Tenant kontrolü
- Abonelik kontrolü
- Modül aktiflik kontrolü
- Permission kontrolü
- Veri erişim kontrolü
- Loglama

# ================================================== 13. STORAGE MİMARİSİ

Dosya ve görseller Cloudflare R2 üzerinde saklanacak.

Kullanım alanları:

- Ürün görselleri
- Fatura/sipariş PDF
- Excel import dosyaları
- Personel belgeleri
- Cari evrakları
- Sözleşmeler
- Destek ekleri

Tenant bazlı klasörleme yapılacak.

Örnek:
tenants/{tenant_id}/products/
tenants/{tenant_id}/documents/
tenants/{tenant_id}/imports/
tenants/{tenant_id}/support/

Storage kullanım limiti paket bazlı olacak.

Veritabanı için GB limiti uygulanmayacak.

# ================================================== 14. LOG VE AUDIT MİMARİSİ

Her kritik işlem audit log oluşturacak.

Audit log içinde:

- tenant_id
- user_id
- module
- action
- entity_type
- entity_id
- old_values
- new_values
- ip_address
- user_agent
- risk_level
- created_at

Hassas veriler maskelenecek:

- Şifre
- Token
- API secret
- Ödeme bilgisi
- Özel entegrasyon anahtarları

Süper admin log merkezi olacak.

Firma admin sadece kendi tenant loglarını görebilecek.

# ================================================== 15. MUHASEBESEL İŞLEM KURALLARI

Para ve stok işlemlerinde direkt değer değiştirme yapılmayacak.
Hareket mantığı kullanılacak.

Satış:

- Satış kaydı
- Satış kalemleri
- Cari hareket
- Stok hareketi
- Kasa/tahsilat varsa kasa hareketi

Tahsilat:

- Cari alacağını azaltır
- Kasa/banka/POS hareketi oluşturur

İade:

- Satışın ters etkisini oluşturur
- Stok geri girişi yapabilir
- Cari hareketini ters yönde etkiler

İptal:

- Fiziksel silme değil
- İptal durumu + ters hareket + audit log

# ================================================== 16. UI / UX KURALLARI

Arayüz %100 Türkçe olacak.

Her liste ekranında:

- Arama
- Filtre
- Sıralama
- Sayfalama
- Excel/PDF dışa aktarım altyapısı
- Detay butonu
- Düzenle butonu
- Yetkiye göre buton göster/gizle

Mobilde:

- Kart görünümü
- Büyük butonlar
- Alt menü veya sade yan menü
- Satış ekranında hızlı ürün ekleme
- PWA uyumu

Sayfalar sayfatasarimlari klasöründeki tasarımlarla uyumlu olmalı.

# ================================================== 17. KESİN KURALLAR

- Sistem %100 Türkçe arayüzle geliştirilecek.
- sayfatasarimlari klasöründeki tasarımlar ana frontend referansı olacak.
- Her sayfa ortak component sistemiyle geliştirilecek.
- Tenant kontrolü olmayan hiçbir veri sorgusu yazma.
- Modül kontrolü olmayan hiçbir modül API’si yazma.
- Permission kontrolü olmayan kritik işlem yazma.
- Migration olmadan veritabanı değişikliği yapma.
- Kritik işlemleri logsuz bırakma.
- Para/stok işlemlerinde direkt değer güncelleme yapma.
- Silme yerine soft delete veya iptal/ters kayıt kullan.
- Dosyaları veritabanına base64 olarak kaydetme.
- Storage erişimini tenant kontrollü yap.
- Asistan altyapısı için modül yardım bilgilerini unutma.
- Public API altyapısını ileride açılabilecek şekilde tasarla.
- ERP entegrasyonu şimdilik kodlanmayacak ama external_id/source_system/sync_status alanları unutulmayacak.
- Satış geçmişleri içeri alınırsa arşiv amaçlı alınacak, cari ve stok hesaplarını etkilemeyecek.

# ================================================== 18. İLK BEKLENEN ÇIKTI

Kod yazmaya başlamadan önce bana şu çıktıları ver:

1. Projenin kısa özeti
2. sayfatasarimlari klasöründen çıkarılan tasarım dili özeti
3. Önerilen teknoloji stack’i
4. Frontend klasör yapısı
5. Component klasör yapısı
6. Backend klasör yapısı
7. İlk veritabanı tablo listesi
8. Migration stratejisi
9. Auth + tenant + yetki akışı
10. Modül/paket kontrol mantığı
11. Log sistemi taslağı
12. Storage/R2 kullanım mantığı
13. İlk MVP faz planı
14. Ajan takımının görev paylaşımı
15. Riskli noktalar ve dikkat edilmesi gerekenler

Bu çıktılar onaylandıktan sonra geliştirmeye başla.
