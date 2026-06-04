name: ux-conventions
description: UI/UX standartları — sayfa düzeni, dil, modal kullanımı, mobil/tablet uyumlu tasarım.
when_to_use: >
  Yeni sayfa veya component tasarlarken.
  UX review yaparken.
  Modal, buton, validasyon standartlarına uygunluğu kontrol ederken.

rules:
  language:
    primary: Türkçe (tüm kullanıcıya görünen metin)
    code: İngilizce (değişken, fonksiyon, dosya adı)
    bad_examples:
      - "Save, Submit, Cancel, Delete → Kaydet, Gönder, İptal, Sil"
      - "Loading... → Yükleniyor..."
      - "Are you sure? → Emin misiniz?"
    good_examples:
      - "Yeni Müşteri Ekle"
      - "Cari bulunamadı"
      - "Onaylıyorum"

  page_layout:
    structure: |
      <PageHeader title="..." description="..." actions={...} />
      {/* KPI kartları (opsiyonel) */}
      {/* Filtre / arama barı */}
      {/* DataTable (desktop) + MobileCardList (mobil) */}
      {/* Modallar (state varsa) */}
    spacing: "space-y-4 ile bölümler arası 16px"
    max_width: "Geniş ekranda max-w-7xl mx-auto, taşma olmamalı"

  modals:
    confirm_modal: |
      <ConfirmModal
        open={!!confirmId}
        title="Silmek istediğinize emin misiniz?"
        description="Bu işlem geri alınamaz."
        confirmText="Sil"
        variant="danger"     // 'danger' | 'info' | 'warning'
        onClose={() => setConfirmId(null)}
        onConfirm={async () => { await delMut.mutateAsync(confirmId); setConfirmId(null); }}
      />
    custom_modal: |
      fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4
      w-full max-w-{sm|md|xl} rounded-lg border border-outline bg-surface
      Modal dışına tıklayınca kapanmalı (e.stopPropagation)

  buttons:
    primary: "bg-primary text-on-primary hover:bg-primary/90"
    secondary: "border border-outline hover:bg-surface-variant"
    danger: "bg-red-600 text-white hover:bg-red-700"
    success: "bg-green-600 text-white hover:bg-green-700"
    icon_only: "p-1.5 rounded text-{color} hover:bg-{color}-50"
    loading: "disabled:opacity-50 + <Loader2 className='animate-spin' />"
    order: "Sağda, birincil aksiyon en sağda. İptal solda."

  forms:
    label_position: "Üstte (block), text-xs text-on-surface-variant"
    input: "rounded-md border border-outline bg-surface px-2 py-1.5 text-sm"
    validation: "Hata: text-xs text-red-600 mt-1"
    required: "Label sonuna * ekle"
    placeholder: "Kullanıcıya rehberlik: 'Cari adı ile ara...'"

  loading_states:
    page: "<LoadingState /> (tüm sayfa için)"
    inline: "<Loader2 className='animate-spin h-4 w-4' />"
    button: "disabled + Loader2 + 'İşleniyor...' metni"

  empty_states:
    icon: "Lucide icon, h-12 w-12 text-on-surface-variant"
    title: "Kısa, net (örn: 'Henüz cari yok')"
    action: "Yeni ekle / İlk X oluştur butonu"
    example: |
      <EmptyState
        icon={<Users className="h-12 w-12" />}
        title="Henüz cari yok"
        description="İlk carini ekle, hemen başla."
        action={<button>İlk Cariyi Ekle</button>}
      />

  responsive:
    breakpoint: "Mobile-first, md: 768px, lg: 1024px"
    table: "Desktop: DataTable, Mobil: MobileCardList. hidden md:block / md:hidden"
    navigation: "Sidebar desktop, MobileBottomNav mobil"
    search: "Topbar'da global arama, mobilde icon-only"
    forms: "sm:grid-cols-2 lg:grid-cols-3 — mobilde tek sütun"

  color_semantics:
    success: "Yeşil (bg-green-100 text-green-800) — onay, aktif, tamamlandı"
    warning: "Amber (bg-amber-100 text-amber-800) — bekliyor, uyarı"
    danger: "Kırmızı (bg-red-100 text-red-800) — hata, sil, kritik"
    info: "Mavi (bg-blue-100 text-blue-800) — bilgi, navigasyon"
    neutral: "Gri (bg-gray-100 text-gray-700) — pasif, devre dışı"

  accessibility:
    labels: "Her input <label> ile eşleşmeli"
    aria: "Modal: role='dialog', aria-labelledby. Button: aria-label."
    keyboard: "Tab sırası mantıklı. Enter = submit. Esc = modal kapat."
    contrast: "WCAG AA — metin/arkaplan kontrast oranı ≥ 4.5:1"
    focus: "Focus-visible: ring-2 ring-primary"

  feedback:
    success: "toast.success('Cari başarıyla eklendi')"
    error: "toast.error(err.message)"
    info: "toast('Mesaj')"
    library: "react-hot-toast"

  pagination:
    position: "Liste altında, sağa yaslı"
    pattern: |
      <div className="flex items-center justify-between">
        <p>Toplam {total} kayıt</p>
        <div className="flex gap-1">{pages.map(p => <button>{p}</button>)}</div>
      </div>

common_pitfalls:
  - "EmptyState action={{ label, onClick }} — ReactNode JSX buton olmalı"
  - "PageHeader subtitle kullanma — description kullan"
  - "Modal'da backdrop tıklanınca kapanmıyor"
  - "Mobilde DataTable — MobileCardList unutuluyor"
  - "Toast mesajı İngilizce — Türkçe olmalı"
  - "Onay modalsız silme işlemi"
  - "Form validasyonu sadece client-side — server-side de olmalı"
  - "Yükleme sırasında buton disabled değil — double submit"
