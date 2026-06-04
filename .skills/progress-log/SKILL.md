---
name: progress-log
description: Türkçe SaaS projesi için ilerleme günlüğü + handoff (devir) skill'i. Her FAZ veya önemli işlem sonunda PROGRESS.md dosyasını günceller; yeni editör projeyi devraldığında 5 dakikada nerede kalındığını anlar. Token-efficient çalışır — tam dokümanları okumak yerine tablo + checklist formatı kullanır. Load when: FAZ tamamlandığında, önemli bir commit'te, kullanıcı "ilerleme", "durum", "neredeyiz", "handoff", "özet", "nerede kaldık" derse veya yeni bir editör bağlamı sorulduğunda.
---

# Progress Log & Handoff Skill

## Amaç
Bu skill, uzun süren projelerde (multi-FAZ) bağlam kaybını önler. Her önemli işlem sonunda **tek bir dosyayı** (`/workspace/PROGRESS.md`) günceller. Yeni editör dosyayı açınca:

1. Hangi FAZ'dayız ✓
2. Ne yapıldı ✓
3. Sırada ne var ✓
4. Mimari kararlar neler ✓
5. Detaylı dokümanlara linkler ✓

5 dakikada anlar, saatlerce doküman okumaz.

## Çalışma Prensibi
- **Tek dosya, tek bakış**: `/workspace/PROGRESS.md` (README gibi dikkat çekici)
- **Token-efficient**: Tablo + checklist. Detay için link. Asla dokümanları kopyalama.
- **Geriye dönük korunur**: Eski girdiler silinmez, sadece üstüne eklenir
- **Tarihli**: Her güncelleme tarih + saat (UTC) taşır
- **Türkçe**: Kullanıcı dili Türkçe, commit mesajları Türkçe

## Dosya Yapısı

`/workspace/PROGRESS.md` aşağıdaki bölümleri içerir (sırası sabit):

```markdown
# Proje İlerleme Günlüğü

> 📌 Yeni editör: BURADAN BAŞLA. 5 dakikada bağlam kazan.

## 🎯 Son Durum
- **Faz**: FAZ X / 14
- **Tarih**: YYYY-MM-DD HH:MM UTC
- **Kapsam**: <tek cümle>
- **Çalışır durum**: <evet/hayır, kanıt>

## ✅ Tamamlanan Fazlar
| FAZ | Başlık | Tarih | Commit | Durum |
|-----|--------|-------|--------|-------|
| 0 | Mimari | 2026-05-28 | abc123 | ✅ |
| 1 | Monorepo | 2026-05-29 | def456 | ✅ |
| ... |

## ⏭️ Sıradaki Faz
### FAZ X — Başlık
- Yapılacaklar (3-7 madde)
- Tahmini süre
- Bağımlılıklar
- Riskler

## 🏗️ Mimari Kararlar (değişmez)
- **Stack**: NestJS+Prisma+Postgres, Vite+React+TS, pnpm monorepo
- **Muhasebe**: Event sourcing (bakiye saklanmaz, hareketten hesaplanır)
- **Multi-tenant**: Her tablo `tenant_id`, izolasyon servis katmanında
- **Soft delete**: `is_deleted` + `cancelled_*` ters kayıt
- **Tasarım**: Tek "CariPro Soft" M3 tema
- ...

## ⚠️ Bilinen Sorunlar / TODO
- [ ] ... (kısa)

## 📚 Detaylı Dokümanlar
- [Mimari (15 madde)](./docs/FAZ-0-ANALIZ-VE-MIMARI.md)
- [Muhasebe mantığı](./docs/muhasebe-mantigi.md)
- [DB diyagramları](./docs/diagrams/)
- [DB şeması](./apps/api/prisma/schema.prisma)
- [FAZ 1 teslimat notu](./docs/FAZ-1-TESLIMAT-NOTU.md)
- [FAZ 2 teslimat notu](./docs/FAZ-2-TESLIMAT-NOTU.md)

## 🔄 Son 5 Güncelleme (geçmişe bakış)
- 2026-06-01 21:00 — FAZ 6 başladı
- 2026-06-01 18:00 — FAZ 5 tamamlandı
- ...
```

## Komutlar

Bu skill 4 komut destekler. Ajan bunları **kendi inisiyatifiyle** çağırır (kullanıcı sormayı beklemeden).

### 1. `init` — İlk kez oluştur
Tamamlanan tüm FAZ'ları geriye dönük yazar. Bir kez çalıştırılır.

```
init_progress_log()
```

**Akış:**
1. `git log --oneline` ile tüm commit'leri çek
2. Mevcut FAZ durumunu tespit et
3. Tamamlananları tabloya yaz
4. Mimari kararları kopyala (docs/FAZ-0'dan)
5. Kaydet

### 2. `update` — Her FAZ sonunda veya önemli commit sonrası
Yeni girdi ekler, "Son Durum" günceller.

```
update_progress_log(faz, baslik, ozet, commit_hash?)
```

**Akış:**
1. Tarihi al (UTC)
2. "Son Durum" bölümünü güncelle
3. Tamamlananlar tablosuna satır ekle (veya mevcut satırı güncelle)
4. Sıradaki FAZ bölümünü yeni FAZ ile güncelle
5. "Son 5 güncelleme" listesine ekle
6. Kaydet

### 3. `handoff` — Yeni editör için kısa özet (token-efficient)
Kullanıcı "neredeyiz?" / "özet" / "handoff" derse, tam dosyayı okumak yerine:
- "Son Durum" bölümünü göster (3-4 satır)
- Sıradaki FAZ'ı göster
- "Mimari Kararlar" ilk 3 satırı
- "Detay için PROGRESS.md oku" de

**Kural**: Asla tek seferde tüm dosyayı baseline context'e koyma. 30 satırı geçme. Kullanıcı isterse dosyayı oku.

### 4. `get_status` — Kısa durum soruları için
Kullanıcı "ne durumdayız?", "FAZ 6 bitti mi?" gibi kısa sorular sorduğunda kullanılır.

**Akış:**
1. PROGRESS.md'den "Son Durum" bölümünü oku
2. 1-2 cümle cevap ver
3. Gerekirse detay için `handoff` çağır

## Güncelleme Tetikleyicileri (ne zaman çağrılır)

✅ **Her FAZ tamamlandığında** → `update`
✅ **Önemli bir bug fix / refactor sonrası** → `update`
✅ **Mimari karar değiştiğinde** → `update` (Mimari Kararlar bölümü)
✅ **Kullanıcı açıkça isterse** → `update` veya `handoff`
✅ **Session başında yön bulma** → `get_status` veya `handoff`

❌ Her küçük commit'te güncelleme (gürültü)
❌ Kullanıcı sormadan `handoff` (pasif)

## Token Tasarrufu Prensipleri

1. **Tablolar > paragraflar**: Karşılaştırma/liste her zaman tablo
2. **Link > içerik**: Detaylı açıklama yerine `docs/` linki
3. **Maddeleme > paragraf**: Checklist formatı okumayı hızlandırır
4. **Son 5 güncelleme**: Geçmiş detayı yok, sadece tarih + başlık
5. **Asla kopyalama**: Şema/doküman içeriğini PROGRESS.md'ye kopyalama, referans ver
6. **Tutma süresi**: Bittiğinde bölümler arşivlenmez (PR değil, internal günlük)

## Hata Durumları

- `PROGRESS.md` yoksa → `init` çağır
- "Son Durum" tutarsızsa → `git log` + dosya sisteminden doğrula
- Tarih formatı bozuksa → UTC ISO 8601 kullan (`YYYY-MM-DD HH:MM UTC`)

## Örnek Akış (FAZ 6 sonunda)

```
# Kullanıcı: "FAZ 6 bitti, push et"
# Ajan: update_progress_log(6, "Cari Modülü", "5 tablo + cari CRUD API + ekstre", "abc1234")
# Ajan: "PROGRESS.md güncellendi. Sırada: FAZ 7 — Stok Modülü"
```

## Örnek Akış (yeni editör geldi)

```
# Kullanıcı: "projeyi devralacak arkadaşa özet ver"
# Ajan: handoff()
# Ajan: (30 satırla özet, sonra "detay için PROGRESS.md oku")
```

## Notlar
- Bu skill, Mavis'in **Mavis** kişiliği ile uyumlu: enerjik, doğrudan, kısa
- Türkçe prompt varsayılan (kullanıcı dili)
- Tüm zaman damgaları UTC (karışıklık önleme)
- Skill otomatik sync: `.skills/progress-log/` runtime'da OSS'a yüklenir
