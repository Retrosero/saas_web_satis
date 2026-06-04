import { useState } from 'react';
import { Building2, Save, Upload, MapPin, Phone, Mail, Globe, Hash, Calendar, FileText } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import toast from 'react-hot-toast';

export function CompanyProfilePage() {
  const [activeTab, setActiveTab] = useState<'genel' | 'vergi' | 'adres' | 'logo'>('genel');
  const [form, setForm] = useState({
    name: 'Demo Firma Ltd. Şti.',
    shortName: 'Demo',
    taxNumber: '1234567890',
    taxOffice: 'Kadıköy',
    tradeRegistryNo: '123456-789',
    mersisNo: '0123456789012345',
    kepAdres: 'demo@hs01.kep.tr',
    address: 'Caferağa Mah. Moda Cad. No:12/4',
    city: 'İstanbul',
    district: 'Kadıköy',
    postalCode: '34710',
    country: 'Türkiye',
    phone: '0216 555 1234',
    phone2: '0216 555 1235',
    email: 'info@demofirma.com',
    website: 'www.demofirma.com',
    foundedYear: '2010',
    employeeCount: '25',
    sector: 'Ticaret',
    currency: 'TRY',
    locale: 'tr-TR',
    timezone: 'Europe/Istanbul',
    workingMode: 'SAAS_MASTER' as 'SAAS_MASTER' | 'ERP_MASTER',
  });

  const handleSave = () => {
    toast.success('Firma bilgileri güncellendi');
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Firma Profili"
        description="Şirket bilgileri, vergi bilgileri, adres ve iletişim — fatura ve resmi yazışmalarda kullanılır"
        actions={
          <button onClick={handleSave} className="btn-primary">
            <Save className="h-4 w-4" />
            Değişiklikleri Kaydet
          </button>
        }
      />

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="border-b border-outline-variant flex overflow-x-auto">
          {([
            { key: 'genel', label: 'Genel Bilgiler', icon: <Building2 className="h-4 w-4" /> },
            { key: 'vergi', label: 'Vergi & Yasal', icon: <Hash className="h-4 w-4" /> },
            { key: 'adres', label: 'İletişim & Adres', icon: <MapPin className="h-4 w-4" /> },
            { key: 'logo', label: 'Logo & Görsel', icon: <FileText className="h-4 w-4" /> },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 h-12 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Genel */}
          {activeTab === 'genel' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  <Building2 className="inline h-3 w-3 mr-1" /> Ticari Ünvan *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Kısa Ad</label>
                <input
                  type="text"
                  value={form.shortName}
                  onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  <Calendar className="inline h-3 w-3 mr-1" /> Kuruluş Yılı
                </label>
                <input
                  type="number"
                  value={form.foundedYear}
                  onChange={(e) => setForm({ ...form, foundedYear: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Çalışan Sayısı</label>
                <input
                  type="number"
                  value={form.employeeCount}
                  onChange={(e) => setForm({ ...form, employeeCount: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Sektör</label>
                <select
                  value={form.sector}
                  onChange={(e) => setForm({ ...form, sector: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
                >
                  <option>Ticaret</option>
                  <option>İmalat</option>
                  <option>Hizmet</option>
                  <option>İnşaat</option>
                  <option>Tarım</option>
                  <option>Teknoloji</option>
                  <option>Diğer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Çalışma Modu</label>
                <select
                  value={form.workingMode}
                  onChange={(e) => setForm({ ...form, workingMode: e.target.value as 'SAAS_MASTER' })}
                  className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
                >
                  <option value="SAAS_MASTER">SaaS Merkez (Bulut)</option>
                  <option value="ERP_MASTER">ERP Merkez (On-premise)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Para Birimi</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
                >
                  <option value="TRY">₺ Türk Lirası (TRY)</option>
                  <option value="USD">$ Amerikan Doları (USD)</option>
                  <option value="EUR">€ Euro (EUR)</option>
                  <option value="GBP">£ İngiliz Sterlini (GBP)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Dil / Yerel Ayar</label>
                <select
                  value={form.locale}
                  onChange={(e) => setForm({ ...form, locale: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
                >
                  <option value="tr-TR">Türkçe (Türkiye)</option>
                  <option value="en-US">English (USA)</option>
                  <option value="de-DE">Deutsch (Deutschland)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Saat Dilimi</label>
                <select
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
                >
                  <option value="Europe/Istanbul">Europe/Istanbul (UTC+3)</option>
                  <option value="UTC">UTC</option>
                  <option value="Europe/London">Europe/London</option>
                </select>
              </div>
            </div>
          )}

          {/* Vergi */}
          {activeTab === 'vergi' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  <Hash className="inline h-3 w-3 mr-1" /> Vergi Numarası (VKN) *
                </label>
                <input
                  type="text"
                  value={form.taxNumber}
                  onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none font-mono"
                />
                <p className="text-xs text-on-surface-variant mt-1">10 veya 11 haneli</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Vergi Dairesi *</label>
                <input
                  type="text"
                  value={form.taxOffice}
                  onChange={(e) => setForm({ ...form, taxOffice: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Ticaret Sicil No</label>
                <input
                  type="text"
                  value={form.tradeRegistryNo}
                  onChange={(e) => setForm({ ...form, tradeRegistryNo: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">MERSİS No</label>
                <input
                  type="text"
                  value={form.mersisNo}
                  onChange={(e) => setForm({ ...form, mersisNo: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none font-mono"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-foreground mb-1">
                  <Mail className="inline h-3 w-3 mr-1" /> Kep Adresi (KEP)
                </label>
                <input
                  type="text"
                  value={form.kepAdres}
                  onChange={(e) => setForm({ ...form, kepAdres: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none font-mono"
                />
                <p className="text-xs text-on-surface-variant mt-1">Resmi yazışmalar için zorunlu</p>
              </div>
            </div>
          )}

          {/* İletişim & Adres */}
          {activeTab === 'adres' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    <Phone className="inline h-3 w-3 mr-1" /> Telefon
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Telefon 2</label>
                  <input
                    type="tel"
                    value={form.phone2}
                    onChange={(e) => setForm({ ...form, phone2: e.target.value })}
                    className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    <Mail className="inline h-3 w-3 mr-1" /> E-posta
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    <Globe className="inline h-3 w-3 mr-1" /> Web Sitesi
                  </label>
                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  <MapPin className="inline h-3 w-3 mr-1" /> Açık Adres
                </label>
                <textarea
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">İl</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">İlçe</label>
                  <input
                    type="text"
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Posta Kodu</label>
                  <input
                    type="text"
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Ülke</label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Logo */}
          {activeTab === 'logo' && (
            <div>
              <div className="card p-6 border-2 border-dashed border-outline-variant">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-3 rounded-lg bg-primary-container flex items-center justify-center">
                    <Building2 className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Firma Logosu</h3>
                  <p className="text-sm text-on-surface-variant mb-4">PNG, JPG veya SVG · max 2 MB</p>
                  <button className="btn-primary">
                    <Upload className="h-4 w-4" />
                    Logo Yükle
                  </button>
                  <p className="text-xs text-on-surface-variant mt-3">
                    Mevcut logo: <span className="font-mono">demo-logo.png</span> (124 KB)
                  </p>
                </div>
              </div>

              <div className="mt-4 card p-4">
                <h3 className="font-semibold text-foreground mb-2">Önizleme</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { bg: 'bg-primary', label: 'Açık temalı' },
                    { bg: 'bg-white', label: 'Beyaz' },
                    { bg: 'bg-foreground', label: 'Koyu' },
                  ].map((variant) => (
                    <div
                      key={variant.label}
                      className={`${variant.bg} p-4 rounded-md flex items-center justify-center`}
                    >
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-1 rounded bg-primary-container flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div className={`text-xs font-semibold ${variant.bg === 'bg-white' ? 'text-foreground' : 'text-on-primary-container'}`}>
                          {form.shortName}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}