/**
 * FAZ HR-2: İşe Giriş / İşten Çıkış Checklist Template
 *
 * Yeni personel/işten çıkış süreci başlatılırken bu template'ler DB'ye kopyalanır.
 * Kullanıcı her maddeyi tek tek tamamlar.
 */

export interface ChecklistItemTemplate {
  itemKey: string;
  title: string;
  description: string;
  isRequired: boolean;
  sortOrder: number;
}

export interface ChecklistTemplate {
  code: string;
  name: string;
  items: ChecklistItemTemplate[];
}

// ============================================================================
// İŞE GİRİŞ (ONBOARDING)
// ============================================================================

export const ONBOARDING_TEMPLATE: ChecklistTemplate = {
  code: 'ONBOARDING',
  name: 'İşe Giriş Süreci',
  items: [
    {
      itemKey: 'identity_info_completed',
      title: 'Kimlik bilgileri tamamlandı',
      description: 'TC, doğum tarihi, ad-soyad bilgileri HR sistemine girildi',
      isRequired: true,
      sortOrder: 1,
    },
    {
      itemKey: 'contact_info_completed',
      title: 'İletişim bilgileri tamamlandı',
      description: 'Telefon, e-posta, adres, acil durum kişisi girildi',
      isRequired: true,
      sortOrder: 2,
    },
    {
      itemKey: 'bank_info_entered',
      title: 'Banka/IBAN bilgisi girildi',
      description: 'Maaş ödemesi için IBAN eklendi',
      isRequired: true,
      sortOrder: 3,
    },
    {
      itemKey: 'contract_uploaded',
      title: 'İş sözleşmesi yüklendi',
      description: 'İmzalı sözleşme PDF olarak evraklara yüklendi',
      isRequired: true,
      sortOrder: 4,
    },
    {
      itemKey: 'kvkk_consent',
      title: 'KVKK metni onaylandı',
      description: 'KVKK aydınlatma/onay belgesi imzalandı ve yüklendi',
      isRequired: true,
      sortOrder: 5,
    },
    {
      itemKey: 'sgk_entry_uploaded',
      title: 'SGK işe giriş evrakı yüklendi',
      description: 'SGK işe giriş bildirgesi eklendi',
      isRequired: true,
      sortOrder: 6,
    },
    {
      itemKey: 'department_assigned',
      title: 'Departman/şube/görev atandı',
      description: 'Çalışma bilgileri (departman, şube, pozisyon) tanımlandı',
      isRequired: true,
      sortOrder: 7,
    },
    {
      itemKey: 'role_assigned',
      title: 'Yetki rolü atandı',
      description: 'Sistem kullanıcı rolü ve permission atandı',
      isRequired: true,
      sortOrder: 8,
    },
    {
      itemKey: 'inventory_assigned',
      title: 'Zimmet verildi',
      description: 'Bilgisayar, telefon, anahtar vb. zimmet formu düzenlendi',
      isRequired: false,
      sortOrder: 9,
    },
    {
      itemKey: 'osh_training_required',
      title: 'İSG eğitimi gerekli mi?',
      description: 'İş Sağlığı ve Güvenliği eğitimi planlandı mı?',
      isRequired: true,
      sortOrder: 10,
    },
    {
      itemKey: 'health_report_required',
      title: 'Sağlık raporu gerekli mi?',
      description: 'İşe giriş sağlık raporu alındı mı?',
      isRequired: false,
      sortOrder: 11,
    },
    {
      itemKey: 'probation_defined',
      title: 'Deneme süresi tanımlandı',
      description: 'Deneme süresi (ay olarak) belirlendi',
      isRequired: true,
      sortOrder: 12,
    },
  ],
};

// ============================================================================
// İŞTEN ÇIKIŞ (OFFBOARDING)
// ============================================================================

export const OFFBOARDING_TEMPLATE: ChecklistTemplate = {
  code: 'OFFBOARDING',
  name: 'İşten Çıkış Süreci',
  items: [
    {
      itemKey: 'termination_date_set',
      title: 'Çıkış tarihi girildi',
      description: 'Son çalışma günü belirlendi',
      isRequired: true,
      sortOrder: 1,
    },
    {
      itemKey: 'termination_reason_set',
      title: 'Çıkış nedeni girildi',
      description: 'İstifa / çıkarılma / emeklilik vb. neden kayıt altına alındı',
      isRequired: true,
      sortOrder: 2,
    },
    {
      itemKey: 'sgk_exit_code',
      title: 'SGK çıkış kodu alanı girildi',
      description: 'SGK çıkış kodu ve bildirge tarihi kaydedildi',
      isRequired: true,
      sortOrder: 3,
    },
    {
      itemKey: 'unused_leave_checked',
      title: 'Kullanılmamış izin kontrol edildi',
      description: 'Kalan izin bakiyesi kontrol edildi, hakediş hesaplandı',
      isRequired: true,
      sortOrder: 4,
    },
    {
      itemKey: 'advance_debt_checked',
      title: 'Avans/borç kontrol edildi',
      description: 'Personelin alacağı/vereceği hesaplandı',
      isRequired: true,
      sortOrder: 5,
    },
    {
      itemKey: 'inventory_returned',
      title: 'Zimmet iadesi kontrol edildi',
      description: 'Tüm zimmetler (bilgisayar, anahtar, vb.) iade alındı',
      isRequired: true,
      sortOrder: 6,
    },
    {
      itemKey: 'last_work_day_confirmed',
      title: 'Son çalışma günü onaylandı',
      description: 'Personel ve yönetici son çalışma gününü teyit etti',
      isRequired: true,
      sortOrder: 7,
    },
    {
      itemKey: 'exit_documents_uploaded',
      title: 'Çıkış evrakları yüklendi',
      description: 'İhbar süresi, SGK çıkış, ibraname vb. evraklar yüklendi',
      isRequired: true,
      sortOrder: 8,
    },
    {
      itemKey: 'access_revoked',
      title: 'Personel erişimi kapatıldı',
      description: 'Sistem erişimi devre dışı bırakıldı, e-posta hesabı donduruldu',
      isRequired: true,
      sortOrder: 9,
    },
  ],
};
