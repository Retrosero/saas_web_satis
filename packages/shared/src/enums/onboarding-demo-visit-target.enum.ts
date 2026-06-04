export enum OnboardingStep {
  START = 'START', COMPANY_INFO = 'COMPANY_INFO', BRAND = 'BRAND', BRANCHES = 'BRANCHES',
  WAREHOUSES = 'WAREHOUSES', CASH_ACCOUNTS = 'CASH_ACCOUNTS', BANKS = 'BANKS',
  USER_INVITES = 'USER_INVITES', PERMISSION_TEMPLATE = 'PERMISSION_TEMPLATE',
  DATA_IMPORT = 'DATA_IMPORT', FIRST_SALE_TEST = 'FIRST_SALE_TEST', COMPLETED = 'COMPLETED',
}
export const OnboardingStepLabel: Record<OnboardingStep, string> = {
  [OnboardingStep.START]: 'Başlangıç', [OnboardingStep.COMPANY_INFO]: 'Firma Bilgileri',
  [OnboardingStep.BRAND]: 'Logo & Marka', [OnboardingStep.BRANCHES]: 'Şubeler',
  [OnboardingStep.WAREHOUSES]: 'Depolar', [OnboardingStep.CASH_ACCOUNTS]: 'Kasalar',
  [OnboardingStep.BANKS]: 'Banka/POS', [OnboardingStep.USER_INVITES]: 'Kullanıcı Davetleri',
  [OnboardingStep.PERMISSION_TEMPLATE]: 'Yetki Şablonu', [OnboardingStep.DATA_IMPORT]: 'Veri Aktarımı',
  [OnboardingStep.FIRST_SALE_TEST]: 'İlk Satış Testi', [OnboardingStep.COMPLETED]: 'Tamamlandı',
};
export const OnboardingStepOrder: OnboardingStep[] = [
  OnboardingStep.START, OnboardingStep.COMPANY_INFO, OnboardingStep.BRAND, OnboardingStep.BRANCHES,
  OnboardingStep.WAREHOUSES, OnboardingStep.CASH_ACCOUNTS, OnboardingStep.BANKS, OnboardingStep.USER_INVITES,
  OnboardingStep.PERMISSION_TEMPLATE, OnboardingStep.DATA_IMPORT, OnboardingStep.FIRST_SALE_TEST, OnboardingStep.COMPLETED,
];
export enum OnboardingStatus { NOT_STARTED = 'NOT_STARTED', IN_PROGRESS = 'IN_PROGRESS', COMPLETED = 'COMPLETED', SKIPPED = 'SKIPPED' }
export const OnboardingStatusLabel: Record<OnboardingStatus, string> = {
  [OnboardingStatus.NOT_STARTED]: 'Başlamadı', [OnboardingStatus.IN_PROGRESS]: 'Devam Ediyor',
  [OnboardingStatus.COMPLETED]: 'Tamamlandı', [OnboardingStatus.SKIPPED]: 'Atlandı',
};

export enum DemoDataSize { SMALL = 'SMALL', MEDIUM = 'MEDIUM', LARGE = 'LARGE' }
export const DemoDataSizeLabel: Record<DemoDataSize, string> = {
  [DemoDataSize.SMALL]: 'Küçük (50 cari, 100 ürün)', [DemoDataSize.MEDIUM]: 'Orta (200 cari, 500 ürün)', [DemoDataSize.LARGE]: 'Geniş (1000 cari, 2000 ürün)',
};

export enum VisitStatus { PLANNED = 'PLANNED', IN_PROGRESS = 'IN_PROGRESS', VISITED = 'VISITED', ORDER_TAKEN = 'ORDER_TAKEN', COLLECTION_TAKEN = 'COLLECTION_TAKEN', COULDNT_MEET = 'COULDNT_MEET', CANCELLED = 'CANCELLED' }
export const VisitStatusLabel: Record<VisitStatus, string> = {
  [VisitStatus.PLANNED]: 'Planlandı', [VisitStatus.IN_PROGRESS]: 'Yolda', [VisitStatus.VISITED]: 'Ziyaret Edildi',
  [VisitStatus.ORDER_TAKEN]: 'Sipariş Alındı', [VisitStatus.COLLECTION_TAKEN]: 'Tahsilat Alındı',
  [VisitStatus.COULDNT_MEET]: 'Görüşülemedi', [VisitStatus.CANCELLED]: 'İptal',
};
export const VisitStatusColor: Record<VisitStatus, string> = {
  [VisitStatus.PLANNED]: 'gray', [VisitStatus.IN_PROGRESS]: 'blue', [VisitStatus.VISITED]: 'green',
  [VisitStatus.ORDER_TAKEN]: 'amber', [VisitStatus.COLLECTION_TAKEN]: 'green', [VisitStatus.COULDNT_MEET]: 'red', [VisitStatus.CANCELLED]: 'gray',
};
export enum VisitPlanStatus { DRAFT = 'DRAFT', ACTIVE = 'ACTIVE', COMPLETED = 'COMPLETED', CANCELLED = 'CANCELLED' }
export const VisitPlanStatusLabel: Record<VisitPlanStatus, string> = {
  [VisitPlanStatus.DRAFT]: 'Taslak', [VisitPlanStatus.ACTIVE]: 'Aktif', [VisitPlanStatus.COMPLETED]: 'Tamamlandı', [VisitPlanStatus.CANCELLED]: 'İptal',
};

export enum TargetType { SALES_AMOUNT = 'SALES_AMOUNT', SALES_COUNT = 'SALES_COUNT', COLLECTION = 'COLLECTION', NEW_CUSTOMER = 'NEW_CUSTOMER', VISIT_COUNT = 'VISIT_COUNT', ORDER_COUNT = 'ORDER_COUNT', BRAND_SALES = 'BRAND_SALES', PRODUCT_SALES = 'PRODUCT_SALES' }
export const TargetTypeLabel: Record<TargetType, string> = {
  [TargetType.SALES_AMOUNT]: 'Satış Tutarı', [TargetType.SALES_COUNT]: 'Satış Adedi', [TargetType.COLLECTION]: 'Tahsilat',
  [TargetType.NEW_CUSTOMER]: 'Yeni Müşteri', [TargetType.VISIT_COUNT]: 'Ziyaret Sayısı', [TargetType.ORDER_COUNT]: 'Sipariş Adedi',
  [TargetType.BRAND_SALES]: 'Marka Satışı', [TargetType.PRODUCT_SALES]: 'Ürün Satışı',
};
export enum TargetStatus { ACTIVE = 'ACTIVE', COMPLETED = 'COMPLETED', FAILED = 'FAILED', EXCEEDED = 'EXCEEDED', CANCELLED = 'CANCELLED' }
export const TargetStatusLabel: Record<TargetStatus, string> = {
  [TargetStatus.ACTIVE]: 'Devam Ediyor', [TargetStatus.COMPLETED]: 'Tamamlandı', [TargetStatus.FAILED]: 'Başarısız',
  [TargetStatus.EXCEEDED]: 'Aşıldı', [TargetStatus.CANCELLED]: 'İptal',
};
export const TargetStatusColor: Record<TargetStatus, string> = {
  [TargetStatus.ACTIVE]: 'blue', [TargetStatus.COMPLETED]: 'green', [TargetStatus.FAILED]: 'red', [TargetStatus.EXCEEDED]: 'amber', [TargetStatus.CANCELLED]: 'gray',
};
export enum TargetPeriod { MONTHLY = 'MONTHLY', QUARTERLY = 'QUARTERLY', YEARLY = 'YEARLY', CUSTOM = 'CUSTOM' }
export const TargetPeriodLabel: Record<TargetPeriod, string> = {
  [TargetPeriod.MONTHLY]: 'Aylık', [TargetPeriod.QUARTERLY]: 'Çeyreklik', [TargetPeriod.YEARLY]: 'Yıllık', [TargetPeriod.CUSTOM]: 'Özel',
};
export enum CommissionType { PERCENTAGE = 'PERCENTAGE', FIXED = 'FIXED', TIERED = 'TIERED', BONUS = 'BONUS' }
export const CommissionTypeLabel: Record<CommissionType, string> = {
  [CommissionType.PERCENTAGE]: 'Yüzde', [CommissionType.FIXED]: 'Sabit', [CommissionType.TIERED]: 'Kademeli', [CommissionType.BONUS]: 'Bonus',
};
