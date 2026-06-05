import type { DocumentType, PageFormat } from '../enums/template.enum';

/**
 * Bir template section (blok). Frontend'de blok-bazlı editörde gösterilir.
 */
export interface TemplateSection {
  id: string;
  type: 'HEADER' | 'COMPANY_INFO' | 'LOGO' | 'CUSTOMER_INFO' | 'DOCUMENT_INFO' | 'ITEMS_TABLE' | 'TOTALS' | 'TAX_INFO' | 'DISCOUNT_INFO' | 'NOTES' | 'SIGNATURE' | 'QR_BARCODE' | 'FOOTER' | 'CUSTOM_TEXT';
  enabled: boolean;
  /** Section'a özel ayarlar (örn. logo pozisyonu, tablo kolon genişlikleri) */
  config?: Record<string, any>;
  /** CUSTOM_TEXT için içerik (HTML/metin) */
  content?: string;
  /** Sıralama */
  order: number;
}

export interface DocumentTemplate {
  id: string;
  tenantId: string | null;     // null = süper admin global şablon
  name: string;
  documentType: DocumentType;
  language: string;             // 'tr', 'en'
  pageFormat: PageFormat;
  customWidth?: number;         // mm (CUSTOM için)
  customHeight?: number;        // mm
  isDefault: boolean;
  isActive: boolean;
  sections: TemplateSection[];
  isDeleted: boolean;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export const TEMPLATE_VARIABLES: Array<{ key: string; label: string; category: string }> = [
  { key: 'logo', label: 'Logo', category: 'Firma' },
  { key: 'companyName', label: 'Firma Adı', category: 'Firma' },
  { key: 'taxOffice', label: 'Vergi Dairesi', category: 'Firma' },
  { key: 'taxNumber', label: 'Vergi Numarası', category: 'Firma' },
  { key: 'companyAddress', label: 'Firma Adresi', category: 'Firma' },
  { key: 'companyPhone', label: 'Telefon', category: 'Firma' },
  { key: 'companyEmail', label: 'E-posta', category: 'Firma' },
  { key: 'customerName', label: 'Cari Adı', category: 'Cari' },
  { key: 'customerCode', label: 'Cari Kodu', category: 'Cari' },
  { key: 'documentNumber', label: 'Belge No', category: 'Belge' },
  { key: 'documentDate', label: 'Belge Tarihi', category: 'Belge' },
  { key: 'productCode', label: 'Ürün Kodu', category: 'Ürün' },
  { key: 'productName', label: 'Ürün Adı', category: 'Ürün' },
  { key: 'barcode', label: 'Barkod', category: 'Ürün' },
  { key: 'quantity', label: 'Miktar', category: 'Ürün' },
  { key: 'unit', label: 'Birim', category: 'Ürün' },
  { key: 'unitPrice', label: 'Birim Fiyat', category: 'Ürün' },
  { key: 'discount', label: 'İskonto', category: 'Ürün' },
  { key: 'vatRate', label: 'KDV %', category: 'Ürün' },
  { key: 'lineTotal', label: 'Satır Toplamı', category: 'Ürün' },
  { key: 'subTotal', label: 'Ara Toplam', category: 'Toplam' },
  { key: 'totalDiscount', label: 'Genel İskonto', category: 'Toplam' },
  { key: 'totalVat', label: 'KDV Toplamı', category: 'Toplam' },
  { key: 'grandTotal', label: 'Genel Toplam', category: 'Toplam' },
  { key: 'notes', label: 'Not', category: 'Diğer' },
  { key: 'preparedBy', label: 'Hazırlayan Kullanıcı', category: 'Diğer' },
];

export const TEMPLATE_VARIABLE_CATEGORIES = ['Firma', 'Cari', 'Belge', 'Ürün', 'Toplam', 'Diğer'] as const;
