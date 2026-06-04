import { useState } from 'react';
import { Search, ChevronRight, MessageCircle, Mail, Phone, BookOpen, CheckCircle, X, Send, FileText, Lightbulb, CreditCard, Settings } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import toast from 'react-hot-toast';

type FaqCategory = 'baslangic' | 'fatura' | 'rapor' | 'teknik' | 'odeme';

interface Faq {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
  helpful: number;
}

const FAQS: Faq[] = [
  {
    id: '1',
    question: 'Cari hesap nasıl oluşturulur?',
    answer: 'Cari → Yeni Cari butonundan açılan formda kod, ad, tip, vergi bilgileri, iletişim ve adres bilgilerini doldurun. Açılış bakiyesi opsiyoneldir; kaydedince otomatik OPENING_BALANCE hareketi oluşturur.',
    category: 'baslangic',
    helpful: 23,
  },
  {
    id: '2',
    question: 'Satış onaylandığında hangi hareketler oluşur?',
    answer: 'Satış onaylanınca otomatik olarak: 1 CustomerMovement(DEBIT) — cari borçlandırılır + N × StockMovement(OUT) — her kalem için stok çıkışı. Tüm hareketler tek transaction\'da yapılır; yarıda kalırsa rollback olur.',
    category: 'fatura',
    helpful: 18,
  },
  {
    id: '3',
    question: 'Tahsilat iptal edilince ne olur?',
    answer: 'Onaylanmış tahsilat iptal edilirse otomatik: 1 CustomerMovement(DEBIT, ters) + 1 CashMovement(OUT, ters). Böylece carinin alacağı geri gelir ve kasa bakiyesi azalır. Silme yok, sadece ters kayıt.',
    category: 'fatura',
    helpful: 15,
  },
  {
    id: '4',
    question: 'Stok miktarı nasıl hesaplanıyor?',
    answer: 'Event-sourcing: Product tablosunda quantity alanı YOK. Stok = SUM(IN) - SUM(OUT) + SUM(ADJUST) — tüm StockMovement tablosundan hesaplanır. Bu sayede geçmişe dönük analiz mümkün olur.',
    category: 'teknik',
    helpful: 27,
  },
  {
    id: '5',
    question: 'Excel\'den toplu cari nasıl aktarılır?',
    answer: 'Veri Aktarım Sihirbazı (/import) üzerinden 4 adımda: 1) Veri tipi seçin, 2) CSV/Excel yükleyin, 3) Sütunları eşleştirin, 4) Önizleme + onay. Şablonu "Şablon İndir" butonundan indirebilirsiniz.',
    category: 'baslangic',
    helpful: 12,
  },
  {
    id: '6',
    question: 'Aylık raporları nasıl alabilirim?',
    answer: 'Raporlar sayfasında (/reports) dashboard özet, en yüksek borçlular, stok uyarıları, satış trendi ve tahsilat trendi otomatik görüntülenir. Veriler event-sourced anlık hesaplanır.',
    category: 'rapor',
    helpful: 19,
  },
  {
    id: '7',
    question: 'Kullanıcı şifresi nasıl sıfırlanır?',
    answer: 'Süper admin paneli (sadece SUPER_ADMIN rolü) → Kullanıcılar → ilgili kullanıcıya tıklayın → "Şifre Sıfırla" butonu. Yeni şifre e-posta ile gönderilir.',
    category: 'teknik',
    helpful: 8,
  },
  {
    id: '8',
    question: 'Ödeme yöntemleri nelerdir?',
    answer: 'Tahsilat oluştururken 6 tür seçilebilir: Nakit, EFT/Havale, POS (kredi kartı), QR kod, Çek, Diğer. Her tür kasa/banka hesabına bağlanır.',
    category: 'odeme',
    helpful: 6,
  },
  {
    id: '9',
    question: 'Plan yükseltme nasıl yapılır?',
    answer: 'Ayarlar → Abonelik sayfasında mevcut planınızı ve limitlerini görürsünüz. "Planı Yükselt" butonu plan karşılaştırma kartı açar. Ödeme yıllık veya aylık olabilir.',
    category: 'odeme',
    helpful: 4,
  },
  {
    id: '10',
    question: 'Çoklu dil desteği var mı?',
    answer: 'Şu an sadece Türkçe. Çoklu dil altyapısı FAZ 16+ planlanıyor. UI metinleri i18n-ready dizinde toplanacak.',
    category: 'teknik',
    helpful: 3,
  },
];

const CATEGORIES: Array<{ key: FaqCategory; label: string; icon: React.ReactNode; color: string }> = [
  { key: 'baslangic', label: 'Başlangıç', icon: <Lightbulb className="h-4 w-4" />, color: 'bg-tertiary-container text-tertiary' },
  { key: 'fatura', label: 'Fatura & Hareket', icon: <FileText className="h-4 w-4" />, color: 'bg-primary-container text-primary' },
  { key: 'rapor', label: 'Raporlar', icon: <BookOpen className="h-4 w-4" />, color: 'bg-secondary-container text-secondary' },
  { key: 'odeme', label: 'Ödeme & Plan', icon: <CreditCard className="h-4 w-4" />, color: 'bg-error-container text-error' },
  { key: 'teknik', label: 'Teknik', icon: <Settings className="h-4 w-4" />, color: 'bg-surface-variant text-on-surface-variant' },
];

export function SupportCenterPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<FaqCategory | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [showContact, setShowContact] = useState(false);
  const [contactForm, setContactForm] = useState({ subject: '', category: 'soru' as 'soru' | 'hata' | 'oneri' | 'fatura', message: '', email: '' });

  const filteredFaqs = FAQS.filter((f) => {
    if (category !== 'all' && f.category !== category) return false;
    if (search && !f.question.toLowerCase().includes(search.toLowerCase()) && !f.answer.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Mesajınız alındı — 24 saat içinde yanıt verilecek');
    setShowContact(false);
    setContactForm({ subject: '', category: 'soru', message: '', email: '' });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Destek Merkezi"
        description="SSS, iletişim ve yardım makaleleri — hızlı çözüm için"
      />

      {/* Hero / Arama */}
      <div className="card p-6 bg-gradient-to-br from-primary-container to-secondary-container text-center">
        <h2 className="text-xl font-bold text-foreground mb-2">Size nasıl yardımcı olabiliriz?</h2>
        <p className="text-sm text-on-surface-variant mb-4">En sık sorulan sorulara göz atın veya bize mesaj gönderin</p>
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Soru, kelime veya konu arayın…"
            className="w-full h-12 pl-10 pr-4 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setShowContact(true)} className="btn-primary">
            <MessageCircle className="h-4 w-4" />
            Bize Mesaj Gönder
          </button>
          <a href="mailto:destek@sistem.local" className="btn-ghost">
            <Mail className="h-4 w-4" />
            E-posta
          </a>
        </div>
      </div>

      {/* Kategoriler */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <button
          onClick={() => setCategory('all')}
          className={`card p-3 text-center transition-colors ${
            category === 'all' ? 'border-primary' : 'hover:border-primary'
          }`}
        >
          <BookOpen className="h-5 w-5 mx-auto mb-1 text-foreground" />
          <div className="text-xs font-medium text-foreground">Tümü ({FAQS.length})</div>
        </button>
        {CATEGORIES.map((c) => {
          const count = FAQS.filter((f) => f.category === c.key).length;
          return (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`card p-3 text-center transition-colors ${
                category === c.key ? 'border-primary' : 'hover:border-primary'
              }`}
            >
              <div className={`inline-flex p-1.5 rounded-md ${c.color} mb-1`}>{c.icon}</div>
              <div className="text-xs font-medium text-foreground">{c.label} ({count})</div>
            </button>
          );
        })}
      </div>

      {/* SSS Listesi */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-outline-variant bg-surface-container">
          <h3 className="font-semibold text-foreground">Sıkça Sorulan Sorular ({filteredFaqs.length})</h3>
        </div>
        {filteredFaqs.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-on-surface-variant">
            "{search}" için sonuç bulunamadı
          </div>
        ) : (
          <div>
            {filteredFaqs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div key={faq.id} className="border-b border-outline-variant last:border-0">
                  <button
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    className="w-full text-left px-4 py-3 hover:bg-surface-container flex items-center gap-3"
                  >
                    <ChevronRight className={`h-4 w-4 text-on-surface-variant transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{faq.question}</div>
                      <div className="text-xs text-on-surface-variant mt-0.5">
                        {CATEGORIES.find((c) => c.key === faq.category)?.label} · {faq.helpful} kişi faydalı buldu
                      </div>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-12 py-3 bg-surface-container text-sm text-foreground">
                      {faq.answer}
                      <div className="flex gap-2 mt-3 text-xs">
                        <span className="text-on-surface-variant">Bu cevap faydalı oldu mu?</span>
                        <button className="text-secondary hover:underline flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Evet
                        </button>
                        <button className="text-on-surface-variant hover:underline">Hayır</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* İletişim kanalları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card p-4">
          <Mail className="h-6 w-6 text-primary mb-2" />
          <h4 className="font-semibold text-foreground">E-posta</h4>
          <p className="text-sm text-on-surface-variant mt-1">24 saat içinde yanıt</p>
          <a href="mailto:destek@sistem.local" className="text-sm text-primary font-mono mt-2 block">
            destek@sistem.local
          </a>
        </div>
        <div className="card p-4">
          <Phone className="h-6 w-6 text-secondary mb-2" />
          <h4 className="font-semibold text-foreground">Telefon</h4>
          <p className="text-sm text-on-surface-variant mt-1">Hafta içi 09:00-18:00</p>
          <a href="tel:+908502221234" className="text-sm text-secondary font-mono mt-2 block">
            0850 222 12 34
          </a>
        </div>
        <div className="card p-4">
          <MessageCircle className="h-6 w-6 text-tertiary mb-2" />
          <h4 className="font-semibold text-foreground">Canlı Destek</h4>
          <p className="text-sm text-on-surface-variant mt-1">Hafta içi 09:00-18:00</p>
          <button onClick={() => setShowContact(true)} className="text-sm text-tertiary font-mono mt-2 block hover:underline">
            Sohbet başlat →
          </button>
        </div>
      </div>

      {/* İletişim Modalı */}
      {showContact && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">Bize Mesaj Gönder</h3>
              <button onClick={() => setShowContact(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">E-posta *</label>
                <input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">Kategori</label>
                <select
                  value={contactForm.category}
                  onChange={(e) => setContactForm({ ...contactForm, category: e.target.value as 'soru' })}
                  className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant"
                >
                  <option value="soru">Genel Soru</option>
                  <option value="hata">Hata Bildirimi</option>
                  <option value="oneri">Öneri</option>
                  <option value="fatura">Fatura/Ödeme</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">Konu *</label>
                <input
                  type="text"
                  required
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">Mesaj *</label>
                <textarea
                  required
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="w-full px-3 py-2 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none resize-none"
                />
              </div>
              <button type="submit" className="btn-primary mt-2">
                <Send className="h-4 w-4" />
                Gönder
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}