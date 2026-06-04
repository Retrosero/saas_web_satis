/**
 * White-Label / Marka ayarları.
 * Tenant bazında özelleştirme: logo, renkler, slogan, iletişim, domain, email, PDF.
 */

export interface WhiteLabelSettings {
  // Logo
  logoUrl?: string;            // Ana logo URL
  logoMiniUrl?: string;       // Mini logo (sidebar)
  faviconUrl?: string;

  // Renkler
  primaryColor?: string;      // Ana renk (hex)
  secondaryColor?: string;    // Yardımcı renk
  menuColor?: string;         // Menü arkaplan
  buttonColor?: string;       // Buton rengi

  // İletişim
  slogan?: string;
  supportEmail?: string;
  supportPhone?: string;

  // Domain
  customDomain?: string;      // "firma.app.com"
  customDomainStatus?: 'PENDING' | 'ACTIVE' | 'FAILED' | 'DISABLED';
  customDomainSslStatus?: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'NONE';

  // Giriş sayfası
  loginPageTitle?: string;
  loginPageSubtitle?: string;
  loginPageBgUrl?: string;
  loginPageShowLogo?: boolean;

  // E-posta şablonları
  emailFromName?: string;
  emailFromAddress?: string;
  emailFooterText?: string;
  emailPrimaryColor?: string;

  // PDF / Fatura
  pdfCompanyName?: string;
  pdfCompanyLogo?: string;
  pdfFooterText?: string;
  pdfShowTaxBreakdown?: boolean;
  pdfPrimaryColor?: string;
  pdfSecondaryColor?: string;
  pdfFontFamily?: string;
}

export const DEFAULT_WHITE_LABEL: WhiteLabelSettings = {
  primaryColor: '#6750A4',
  secondaryColor: '#625B71',
  customDomainStatus: 'PENDING',
  customDomainSslStatus: 'NONE',
  loginPageShowLogo: true,
  pdfShowTaxBreakdown: true,
  pdfFontFamily: 'Inter',
};
