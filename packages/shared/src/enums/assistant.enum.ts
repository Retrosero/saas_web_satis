/**
 * Akıllı Asistan Bilgi Tabanı enumları.
 *
 * NOT: Chat backend bu fazda YOK. Sadece KB (knowledge base) CRUD'u ve
 * ileride kullanılacak altyapı hazırlanacak.
 * Asistan kullanıcının normalde göremeyeceği veriyi cevaplayamayacak.
 */

export const HelpContentType = {
  MODULE: 'MODULE',             // Modül açıklaması
  PAGE: 'PAGE',                 // Sayfa açıklaması
  BUTTON: 'BUTTON',             // Buton açıklaması
  FAQ: 'FAQ',                   // SSS
  GUIDE: 'GUIDE',               // İşlem rehberi
  WARNING: 'WARNING',           // Uyarı metni
} as const;
export type HelpContentType = (typeof HelpContentType)[keyof typeof HelpContentType];

export const AssistantToolStatus = {
  ACTIVE: 'ACTIVE',
  PASSIVE: 'PASSIVE',
} as const;
export type AssistantToolStatus = (typeof AssistantToolStatus)[keyof typeof AssistantToolStatus];

export const HelpContentTypeLabel: Record<HelpContentType, string> = {
  MODULE: 'Modül Açıklaması',
  PAGE: 'Sayfa Açıklaması',
  BUTTON: 'Buton Açıklaması',
  FAQ: 'SSS',
  GUIDE: 'İşlem Rehberi',
  WARNING: 'Uyarı Metni',
};
