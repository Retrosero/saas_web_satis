# FAZ 49 — Barkod / Etiket Tasarımı

## Amaç
Ürünler için barkod, raf ve fiyat etiketi tasarla, yazdır.

## 3 Hazır Şablon (onModuleInit'te seed)
1. **Standart Barkod Etiketi** (58mm x 25mm) — EAN-13 barkod
2. **Raf Etiketi** (A4) — ürün adı + kod + kategori
3. **Fiyat Etiketi** (80mm x 40mm) — büyük fiyat

## LabelType Enum
- `BARCODE` — Barkod
- `SHELF` — Raf
- `PRICE` — Fiyat
- `CUSTOM` — Özel

## LabelPageSize Enum
- `SIZE_58MM` (50x25mm)
- `SIZE_80MM` (70x40mm)
- `A4` (100x50mm)
- `CUSTOM` (serbest)

## Backend

### LabelsService
- `onModuleInit` — 3 global şablon seed
- `listTemplates(tenantId)` → tenant + global şablonlar
- `getTemplate(tenantId, id)` → tek şablon
- `createTemplate(tenantId, input, userId)` → yeni
- `updateTemplate(tenantId, id, input)` → güncelle
- `deleteTemplate(tenantId, id)` → sil (global silinemez)
- `printLabels(tenantId, templateId, productIds, copies)` → print job oluştur
- `listPrintJobs(tenantId, limit)` → son yazdırmalar

### Endpoint'ler
- `GET /labels/templates` → liste
- `GET /labels/templates/:id` → detay
- `POST /labels/templates` → oluştur
- `PUT /labels/templates/:id` → güncelle
- `DELETE /labels/templates/:id` → sil
- `POST /labels/print` → yazdırma job'ı
- `GET /labels/jobs?limit=` → print history

## Tablolar
- `LabelTemplate` (id, tenantId, name, type, pageSize, widthMm, heightMm, isGlobal, layout JSON, createdById, ...)
- `LabelPrintJob` (id, tenantId, templateId, productIds String[], copies, printedById, printedAt)

## Layout JSON
```json
{
  "fields": [
    { "field": "productName", "x": 2, "y": 2, "fontSize": 10 },
    { "field": "price", "x": 35, "y": 13, "fontSize": 12, "fontWeight": "bold" }
  ],
  "barcode": { "type": "EAN13", "position": "bottom", "size": 30 }
}
```

## Frontend
- `LabelsPage` — şablon listesi, yeni şablon modal (ad + tip + boyut + w/h), print butonu

## Frontend Print
- JSBarcode + html2canvas ile browser print
- Server-side PDF render YOK (puppeteer performansı kötü)

## Permission Key'leri
- `labels.view`, `labels.create`, `labels.update`, `labels.print`

## Sık Sorulan Sorular

**S: "Hazır şablonlar var mı?"**
C: Evet, 3 tane (barkod, raf, fiyat). Global, tenant silemez.

**S: "Özel boyut eklenebilir mi?"**
C: Evet, LabelPageSize.CUSTOM ile serbest width/height.

**S: "Print job saklanıyor mu?"**
C: Evet, LabelPrintJob tablosunda. Hangi ürünler, kaç kopya, kim yazdırdı, ne zaman.

**S: "Barkod tipi seçilebilir mi?"**
C: Layout JSON'da `barcode.type` alanı. EAN-13, CODE-128, QR Code desteklenir (JSBarcode kütüphanesi).

**S: "Sunucu tarafında PDF oluşturuluyor mu?"**
C: Hayır, browser print kullanılıyor. Performans + sadelik için. Çok büyük partiler için BullMQ + Puppeteer eklenebilir.
