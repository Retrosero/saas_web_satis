import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { LoadingState } from '@/components/data/LoadingState';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const TenantsPage = lazy(() => import('@/pages/super-admin/TenantsPage').then((m) => ({ default: m.TenantsPage })));
const TenantDetailPage = lazy(() => import('@/pages/super-admin/TenantDetailPage').then((m) => ({ default: m.TenantDetailPage })));
const TenantPlansPage = lazy(() => import('@/pages/super-admin/TenantPlansPage').then((m) => ({ default: m.TenantPlansPage })));
const SuperAdminDashboardPage = lazy(() => import('@/pages/super-admin/SuperAdminDashboardPage').then((m) => ({ default: m.SuperAdminDashboardPage })));
const SuperAdminLogsPage = lazy(() => import('@/pages/super-admin/SuperAdminLogsPage').then((m) => ({ default: m.SuperAdminLogsPage })));
const PlansPage = lazy(() => import('@/pages/super-admin/PlansPage').then((m) => ({ default: m.PlansPage })));
const ModulesPage = lazy(() => import('@/pages/super-admin/ModulesPage').then((m) => ({ default: m.ModulesPage })));
const UsersPage = lazy(() => import('@/pages/super-admin/UsersPage').then((m) => ({ default: m.UsersPage })));
const SettingsOverviewPage = lazy(() => import('@/pages/settings/SettingsOverviewPage').then((m) => ({ default: m.SettingsOverviewPage })));
const SettingsSubscriptionPage = lazy(() => import('@/pages/settings/SettingsSubscriptionPage').then((m) => ({ default: m.SettingsSubscriptionPage })));
const SettingsModulesPage = lazy(() => import('@/pages/settings/SettingsModulesPage').then((m) => ({ default: m.SettingsModulesPage })));
const SettingsUsersPage = lazy(() => import('@/pages/settings/SettingsUsersPage').then((m) => ({ default: m.SettingsUsersPage })));
const SettingsRolesPage = lazy(() => import('@/pages/settings/SettingsRolesPage').then((m) => ({ default: m.SettingsRolesPage })));
const SettingsLogsPage = lazy(() => import('@/pages/settings/SettingsLogsPage').then((m) => ({ default: m.SettingsLogsPage })));
const SettingsLayout = lazy(() => import('@/layouts/SettingsLayout').then((m) => ({ default: m.SettingsLayout })));
const NotFoundPage = lazy(() => import('@/pages/errors/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const ForbiddenPage = lazy(() => import('@/pages/errors/ForbiddenPage').then((m) => ({ default: m.ForbiddenPage })));

// FAZ 6 — Cari Modülü
const CustomerListPage = lazy(() => import('@/pages/customers/CustomerListPage').then((m) => ({ default: m.CustomerListPage })));
const CustomerNewPage = lazy(() => import('@/pages/customers/CustomerNewPage').then((m) => ({ default: m.CustomerNewPage })));
const CustomerDetailPage = lazy(() => import('@/pages/customers/CustomerDetailPage').then((m) => ({ default: m.CustomerDetailPage })));
const CustomerMovementDetailPage = lazy(() => import('@/pages/customers/CustomerMovementDetailPage').then((m) => ({ default: m.CustomerMovementDetailPage })));

// FAZ HR-1 — İK Personel Özlük Kartı
const EmployeeListPage = lazy(() => import('@/pages/hr/EmployeeListPage').then((m) => ({ default: m.EmployeeListPage })));
const EmployeeFormPage = lazy(() => import('@/pages/hr/EmployeeFormPage').then((m) => ({ default: m.EmployeeFormPage })));
const EmployeeDetailPage = lazy(() => import('@/pages/hr/EmployeeDetailPage').then((m) => ({ default: m.EmployeeDetailPage })));
// FAZ HR-2 — İşe Giriş/Çıkış Checklist
const OnboardingChecklistPage = lazy(() => import('@/pages/hr/ChecklistPage').then((m) => ({ default: m.OnboardingChecklistPage })));
const OffboardingChecklistPage = lazy(() => import('@/pages/hr/ChecklistDetailPage').then((m) => ({ default: m.OffboardingChecklistPage })));
const OnboardingListPage = lazy(() => import('@/pages/hr/OnboardingListPage').then((m) => ({ default: m.OnboardingListPage })));
const OffboardingListPage = lazy(() => import('@/pages/hr/OffboardingListPage').then((m) => ({ default: m.OffboardingListPage })));

// FAZ HR-3 — İzin Yönetimi
const LeaveTypesPage = lazy(() => import('@/pages/hr/LeaveTypesPage').then((m) => ({ default: m.LeaveTypesPage })));
const LeaveRequestsPage = lazy(() => import('@/pages/hr/LeaveRequestsPage').then((m) => ({ default: m.LeaveRequestsPage })));
const LeaveRequestDetailPage = lazy(() => import('@/pages/hr/LeaveRequestDetailPage').then((m) => ({ default: m.LeaveRequestDetailPage })));
const LeaveRequestFormPage = lazy(() => import('@/pages/hr/LeaveRequestDetailPage').then((m) => ({ default: m.LeaveRequestFormPage })));

// FAZ HR-4 — Bordro Hazırlık
const PayrollPeriodsPage = lazy(() => import('@/pages/hr/PayrollPeriodsPage').then((m) => ({ default: m.PayrollPeriodsPage })));
const PayrollDetailPage = lazy(() => import('@/pages/hr/PayrollDetailPage').then((m) => ({ default: m.PayrollDetailPage })));

// HR-5/6/7 — Bordro Parametreleri, Devamsızlık, Kariyer, Eğitim, Performans
const PayrollParamsPage = lazy(() => import('@/pages/hr/PayrollParamsPage').then((m) => ({ default: m.PayrollParamsPage })));
const HR567Page = lazy(() => import('@/pages/hr/HR567Page').then((m) => ({ default: m.HR567Page })));
const HR8910Page = lazy(() => import('@/pages/hr/HR8910Page').then((m) => ({ default: m.HR8910Page })));
const ProductListPage = lazy(() => import('@/pages/products/ProductListPage').then((m) => ({ default: m.ProductListPage })));
const ProductNewPage = lazy(() => import('@/pages/products/ProductNewPage').then((m) => ({ default: m.ProductNewPage })));
const ProductDetailPage = lazy(() => import('@/pages/products/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const WarehouseListPage = lazy(() => import('@/pages/warehouses/WarehouseListPage').then((m) => ({ default: m.WarehouseListPage })));

// FAZ 21 — İade Yönetimi
const ReturnListPage = lazy(() => import('@/pages/returns/ReturnListPage').then((m) => ({ default: m.ReturnListPage })));
const ReturnFormPage = lazy(() => import('@/pages/returns/ReturnFormPage').then((m) => ({ default: m.ReturnFormPage })));
const ReturnDetailPage = lazy(() => import('@/pages/returns/ReturnDetailPage').then((m) => ({ default: m.ReturnDetailPage })));
const ReturnApprovalPage = lazy(() => import('@/pages/returns/ReturnApprovalPage').then((m) => ({ default: m.ReturnApprovalPage })));

// FAZ 22 — Banka & POS
const BankAccountsPage = lazy(() => import('@/pages/banks/BankAccountsPage').then((m) => ({ default: m.BankAccountsPage })));
const BankAccountFormPage = lazy(() => import('@/pages/banks/BankAccountFormPage').then((m) => ({ default: m.BankAccountFormPage })));
const BankTransactionsPage = lazy(() => import('@/pages/banks/BankTransactionsPage').then((m) => ({ default: m.BankTransactionsPage })));
const BankTransactionNewPage = lazy(() => import('@/pages/banks/BankTransactionNewPage').then((m) => ({ default: m.BankTransactionNewPage })));
const PosDevicesPage = lazy(() => import('@/pages/banks/PosDevicesPage').then((m) => ({ default: m.PosDevicesPage })));
const PosCollectionsPage = lazy(() => import('@/pages/banks/PosCollectionsPage').then((m) => ({ default: m.PosCollectionsPage })));
const PosCommissionPage = lazy(() => import('@/pages/banks/PosCommissionPage').then((m) => ({ default: m.PosCommissionPage })));

// FAZ 23 — Bayi/Müşteri Portalı
const PortalLoginPage = lazy(() => import('@/pages/portal/PortalLoginPage').then((m) => ({ default: m.PortalLoginPage })));
const PortalLayout = lazy(() => import('@/pages/portal/PortalLayout').then((m) => ({ default: m.PortalLayout })));
const PortalDashboardPage = lazy(() => import('@/pages/portal/PortalDashboardPage').then((m) => ({ default: m.PortalDashboardPage })));
const PortalCatalogPage = lazy(() => import('@/pages/portal/PortalCatalogPage').then((m) => ({ default: m.PortalCatalogPage })));
const PortalProductDetailPage = lazy(() => import('@/pages/portal/PortalProductDetailPage').then((m) => ({ default: m.PortalProductDetailPage })));
const PortalCartPage = lazy(() => import('@/pages/portal/PortalCartPage').then((m) => ({ default: m.PortalCartPage })));
const PortalOrdersPage = lazy(() => import('@/pages/portal/PortalOrdersPage').then((m) => ({ default: m.PortalOrdersPage })));
const PortalOrderDetailPage = lazy(() => import('@/pages/portal/PortalOrderDetailPage').then((m) => ({ default: m.PortalOrderDetailPage })));
const PortalStatementPage = lazy(() => import('@/pages/portal/PortalStatementPage').then((m) => ({ default: m.PortalStatementPage })));
const PortalProfilePage = lazy(() => import('@/pages/portal/PortalProfilePage').then((m) => ({ default: m.PortalProfilePage })));
const StockMovementsPage = lazy(() => import('@/pages/stock/StockMovementsPage').then((m) => ({ default: m.StockMovementsPage })));

// FAZ 8 — Satış Modülü
const SaleListPage = lazy(() => import('@/pages/sales/SaleListPage').then((m) => ({ default: m.SaleListPage })));
const SaleNewPage = lazy(() => import('@/pages/sales/saleNewPage').then((m) => ({ default: m.SaleNewPage })));
const SaleDetailPage = lazy(() => import('@/pages/sales/SaleDetailPage').then((m) => ({ default: m.SaleDetailPage })));

// FAZ 9 — Sipariş Modülü
const OrderListPage = lazy(() => import('@/pages/orders/OrderListPage').then((m) => ({ default: m.OrderListPage })));
const OrderNewPage = lazy(() => import('@/pages/orders/OrderNewPage').then((m) => ({ default: m.OrderNewPage })));
const OrderDetailPage = lazy(() => import('@/pages/orders/OrderDetailPage').then((m) => ({ default: m.OrderDetailPage })));

// FAZ 10 — Tahsilat Modülü
const CollectionListPage = lazy(() => import('@/pages/collections/CollectionListPage').then((m) => ({ default: m.CollectionListPage })));
const CollectionNewPage = lazy(() => import('@/pages/collections/CollectionNewPage').then((m) => ({ default: m.CollectionNewPage })));
const CollectionDetailPage = lazy(() => import('@/pages/collections/CollectionDetailPage').then((m) => ({ default: m.CollectionDetailPage })));

// Alış Faturaları
const PurchaseInvoiceListPage = lazy(() => import('@/pages/purchase-invoices/PurchaseInvoiceListPage').then((m) => ({ default: m.PurchaseInvoiceListPage })));
const PurchaseInvoiceFormPage = lazy(() => import('@/pages/purchase-invoices/PurchaseInvoiceFormPage').then((m) => ({ default: m.PurchaseInvoiceFormPage })));
const PurchaseInvoiceDetailPage = lazy(() => import('@/pages/purchase-invoices/PurchaseInvoiceDetailPage').then((m) => ({ default: m.PurchaseInvoiceDetailPage })));

// FAZ 11 — Kasa Modülü
const CashListPage = lazy(() => import('@/pages/cash/CashListPage').then((m) => ({ default: m.CashListPage })));
const CashDetailPage = lazy(() => import('@/pages/cash/CashDetailPage').then((m) => ({ default: m.CashDetailPage })));

// FAZ 14 — Depo Yönetimi
const WarehouseDetailPage = lazy(() => import('@/pages/warehouses/WarehouseDetailPage').then((m) => ({ default: m.WarehouseDetailPage })));
const WarehouseFormPage = lazy(() => import('@/pages/warehouses/WarehouseFormPage').then((m) => ({ default: m.WarehouseFormPage })));
const WarehouseStockPage = lazy(() => import('@/pages/warehouses/WarehouseStockPage').then((m) => ({ default: m.WarehouseStockPage })));
const WarehouseMovementsPage = lazy(() => import('@/pages/warehouses/WarehouseMovementsPage').then((m) => ({ default: m.WarehouseMovementsPage })));
const WarehouseTransferPage = lazy(() => import('@/pages/warehouses/WarehouseTransferPage').then((m) => ({ default: m.WarehouseTransferPage })));

// FAZ 15 — Stok Sayım Modülü
const StockCountListPage = lazy(() => import('@/pages/stock-count/StockCountListPage').then((m) => ({ default: m.StockCountListPage })));
const StockCountNewPage = lazy(() => import('@/pages/stock-count/StockCountNewPage').then((m) => ({ default: m.StockCountNewPage })));
const StockCountBarcodePage = lazy(() => import('@/pages/stock-count/StockCountBarcodePage').then((m) => ({ default: m.StockCountBarcodePage })));
const StockCountDetailPage = lazy(() => import('@/pages/stock-count/StockCountDetailPage').then((m) => ({ default: m.StockCountDetailPage })));
const StockCountDifferencesPage = lazy(() => import('@/pages/stock-count/StockCountDifferencesPage').then((m) => ({ default: m.StockCountDifferencesPage })));
const StockCountApprovalPage = lazy(() => import('@/pages/stock-count/StockCountApprovalPage').then((m) => ({ default: m.StockCountApprovalPage })));

// FAZ 12 — Raporlar Modülü

// 2. PAKET — Excel Import, Storage, Tasks, Support, Firma Profili
const ImportWizardPage = lazy(() => import('@/pages/import/ImportWizardPage').then((m) => ({ default: m.ImportWizardPage })));
// FAZ 25 — API & Webhook
const ApiKeysPage = lazy(() => import('@/pages/api/ApiKeysPage').then((m) => ({ default: m.ApiKeysPage })));
const UsageLogsPage = lazy(() => import('@/pages/api/UsageLogsPage').then((m) => ({ default: m.UsageLogsPage })));
const WebhooksPage = lazy(() => import('@/pages/api/WebhooksPage').then((m) => ({ default: m.WebhooksPage })));
const DeliveriesPage = lazy(() => import('@/pages/api/DeliveriesPage').then((m) => ({ default: m.DeliveriesPage })));
// FAZ 26 — Akıllı Asistan Bilgi Tabanı
const AssistantArticlesPage = lazy(() => import('@/pages/assistant/AssistantArticlesPage').then((m) => ({ default: m.AssistantArticlesPage })));
const AssistantArticleFormPage = lazy(() => import('@/pages/assistant/AssistantArticleFormPage').then((m) => ({ default: m.AssistantArticleFormPage })));
const AssistantToolsPage = lazy(() => import('@/pages/assistant/AssistantToolsPage').then((m) => ({ default: m.AssistantToolsPage })));
// FAZ 27 — White-Label
const WhiteLabelPage = lazy(() => import('@/pages/white-label/WhiteLabelPage').then((m) => ({ default: m.WhiteLabelPage })));
// FAZ 28 — Sistem Sağlığı
const MonitoringPage = lazy(() => import('@/pages/monitoring/MonitoringPage').then((m) => ({ default: m.MonitoringPage })));
const ErrorLogsPage = lazy(() => import('@/pages/monitoring/ErrorLogsPage').then((m) => ({ default: m.ErrorLogsPage })));
// FAZ 29 — Fiyat Listesi / Kampanya
const PriceListsPage = lazy(() => import('@/pages/pricing/PriceListsPage').then((m) => ({ default: m.PriceListsPage })));
const PriceListFormPage = lazy(() => import('@/pages/pricing/PriceListFormPage').then((m) => ({ default: m.PriceListFormPage })));
const CustomerGroupsPage = lazy(() => import('@/pages/pricing/CustomerGroupsPage').then((m) => ({ default: m.CustomerGroupsPage })));
const CampaignsPage = lazy(() => import('@/pages/pricing/CampaignsPage').then((m) => ({ default: m.CampaignsPage })));
const CampaignFormPage = lazy(() => import('@/pages/pricing/CampaignFormPage').then((m) => ({ default: m.CampaignFormPage })));
const CampaignTestPage = lazy(() => import('@/pages/pricing/CampaignTestPage').then((m) => ({ default: m.CampaignTestPage })));
// FAZ 30 — Belge/PDF Şablon
const TemplatesListPage = lazy(() => import('@/pages/templates/TemplatesListPage').then((m) => ({ default: m.TemplatesListPage })));
const TemplateFormPage = lazy(() => import('@/pages/templates/TemplateFormPage').then((m) => ({ default: m.TemplateFormPage })));
const TemplatePreviewPage = lazy(() => import('@/pages/templates/TemplatePreviewPage').then((m) => ({ default: m.TemplatePreviewPage })));
const TemplateDefaultsPage = lazy(() => import('@/pages/templates/TemplateDefaultsPage').then((m) => ({ default: m.TemplateDefaultsPage })));
// FAZ 31 — Gelişmiş Rapor / Pivot
const ReportsHomePage = lazy(() => import('@/pages/reports/ReportsHomePage').then((m) => ({ default: m.ReportsHomePage })));
const PivotDesignerPage = lazy(() => import('@/pages/reports/PivotDesignerPage').then((m) => ({ default: m.PivotDesignerPage })));
const ReportTemplatesPage = lazy(() => import('@/pages/reports/ReportTemplatesPage').then((m) => ({ default: m.ReportTemplatesPage })));
const ScheduledReportsPage = lazy(() => import('@/pages/reports/ScheduledReportsPage').then((m) => ({ default: m.ScheduledReportsPage })));
// FAZ 32 — Bildirim Kural Motoru
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationCenterPage').then((m) => ({ default: m.NotificationCenterPage })));
const NotificationCenterPage = lazy(() => import('@/pages/notifications/NotificationCenterPage').then((m) => ({ default: m.NotificationCenterPage })));
const NotificationRulesPage = lazy(() => import('@/pages/notifications/NotificationRulesPage').then((m) => ({ default: m.NotificationRulesPage })));
const NotificationRuleFormPage = lazy(() => import('@/pages/notifications/NotificationRuleFormPage').then((m) => ({ default: m.NotificationRuleFormPage })));
const NotificationChannelsPage = lazy(() => import('@/pages/notifications/NotificationChannelsPage').then((m) => ({ default: m.NotificationChannelsPage })));
const NotificationChannelFormPage = lazy(() => import('@/pages/notifications/NotificationChannelFormPage').then((m) => ({ default: m.NotificationChannelFormPage })));
const NotificationLogsPage = lazy(() => import('@/pages/notifications/NotificationLogsPage').then((m) => ({ default: m.NotificationLogsPage })));
// FAZ 33 — Onay Akışları
const ApprovalsHomePage = lazy(() => import('@/pages/approvals/ApprovalsHomePage').then((m) => ({ default: m.ApprovalsHomePage })));
const ApprovalRulesPage = lazy(() => import('@/pages/approvals/ApprovalRulesPage').then((m) => ({ default: m.ApprovalRulesPage })));
const ApprovalRuleFormPage = lazy(() => import('@/pages/approvals/ApprovalRuleFormPage').then((m) => ({ default: m.ApprovalRuleFormPage })));
const ApprovalRequestsPage = lazy(() => import('@/pages/approvals/ApprovalRequestsPage').then((m) => ({ default: m.ApprovalRequestsPage })));
const ApprovalRequestDetailPage = lazy(() => import('@/pages/approvals/ApprovalRequestDetailPage').then((m) => ({ default: m.ApprovalRequestDetailPage })));
// FAZ 34 — Denetim
const AuditHomePage = lazy(() => import('@/pages/audit/AuditHomePage').then((m) => ({ default: m.AuditHomePage })));
const AuditRulesPage = lazy(() => import('@/pages/audit/AuditRulesPage').then((m) => ({ default: m.AuditRulesPage })));
const AuditRuleFormPage = lazy(() => import('@/pages/audit/AuditRuleFormPage').then((m) => ({ default: m.AuditRuleFormPage })));
const AuditRunsPage = lazy(() => import('@/pages/audit/AuditRunsPage').then((m) => ({ default: m.AuditRunsPage })));
const AuditRunDetailPage = lazy(() => import('@/pages/audit/AuditRunDetailPage').then((m) => ({ default: m.AuditRunDetailPage })));
const AuditResultsPage = lazy(() => import('@/pages/audit/AuditResultsPage').then((m) => ({ default: m.AuditResultsPage })));
const AuditResultDetailPage = lazy(() => import('@/pages/audit/AuditResultDetailPage').then((m) => ({ default: m.AuditResultDetailPage })));
const AuditStatsPage = lazy(() => import('@/pages/audit/AuditStatsPage').then((m) => ({ default: m.AuditStatsPage })));
const AuditSchedulesPage = lazy(() => import('@/pages/audit/AuditSchedulesPage').then((m) => ({ default: m.AuditSchedulesPage })));
const AuditLogsPage = lazy(() => import('@/pages/audit/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage })));
// FAZ 35 — AI Asistan
const ChatHomePage = lazy(() => import('@/pages/assistant-chat/ChatHomePage').then((m) => ({ default: m.ChatHomePage })));
const ChatSessionPage = lazy(() => import('@/pages/assistant-chat/ChatSessionPage').then((m) => ({ default: m.ChatSessionPage })));
const LLMConfigPage = lazy(() => import('@/pages/assistant-chat/LLMConfigPage').then((m) => ({ default: m.LLMConfigPage })));
const ChatStatsPage = lazy(() => import('@/pages/assistant-chat/ChatStatsPage').then((m) => ({ default: m.ChatStatsPage })));
// FAZ 36 — Süper Admin AI Observability
const AIDashboardPage = lazy(() => import('@/pages/super-admin/AIDashboardPage').then((m) => ({ default: m.AIDashboardPage })));
const AIConversationsPage = lazy(() => import('@/pages/super-admin/AIConversationsPage').then((m) => ({ default: m.AIConversationsPage })));
const AIConversationDetailPage = lazy(() => import('@/pages/super-admin/AIConversationDetailPage').then((m) => ({ default: m.AIConversationDetailPage })));
const AITrainingDataPage = lazy(() => import('@/pages/super-admin/AITrainingDataPage').then((m) => ({ default: m.AITrainingDataPage })));
// FAZ 39-43
const OnboardingWizardPage = lazy(() => import('@/pages/onboarding/OnboardingWizardPage').then((m) => ({ default: m.OnboardingWizardPage })));
const IndustryTemplatesPage = lazy(() => import('@/pages/industry-templates/IndustryTemplatesPage').then((m) => ({ default: m.IndustryTemplatesPage })));
const DemoCompanyPage = lazy(() => import('@/pages/demo-company/DemoCompanyPage').then((m) => ({ default: m.DemoCompanyPage })));
const VisitsPlansPage = lazy(() => import('@/pages/visits/VisitsPlansPage').then((m) => ({ default: m.VisitsPlansPage })));
const VisitPlanFormPage = lazy(() => import('@/pages/visits/VisitPlanFormPage').then((m) => ({ default: m.VisitPlanFormPage })));
const VisitPlanDetailPage = lazy(() => import('@/pages/visits/VisitPlanDetailPage').then((m) => ({ default: m.VisitPlanDetailPage })));
const TargetsPage = lazy(() => import('@/pages/performance/TargetsPage').then((m) => ({ default: m.TargetsPage })));
const TargetFormPage = lazy(() => import('@/pages/performance/TargetFormPage').then((m) => ({ default: m.TargetFormPage })));
const CommissionsPage = lazy(() => import('@/pages/performance/CommissionsPage').then((m) => ({ default: m.CommissionsPage })));
const QuotesListPage = lazy(() => import('@/pages/quotes/QuotesListPage').then((m) => ({ default: m.QuotesListPage })));
const QuoteFormPage = lazy(() => import('@/pages/quotes/QuoteFormPage').then((m) => ({ default: m.QuoteFormPage })));
const QuoteDetailPage = lazy(() => import('@/pages/quotes/QuoteDetailPage').then((m) => ({ default: m.QuoteDetailPage })));
const CustomerRiskPage = lazy(() => import('@/pages/customer-risk/CustomerRiskPage').then((m) => ({ default: m.CustomerRiskPage })));
const RiskConfigPage = lazy(() => import('@/pages/customer-risk/RiskConfigPage').then((m) => ({ default: m.RiskConfigPage })));
const BulkOperationsPage = lazy(() => import('@/pages/bulk-operations/BulkOperationsPage').then((m) => ({ default: m.BulkOperationsPage })));
const LabelsPage = lazy(() => import('@/pages/labels/LabelsPage').then((m) => ({ default: m.LabelsPage })));
const ProductImagesPage = lazy(() => import('@/pages/product-images/ProductImagesPage').then((m) => ({ default: m.ProductImagesPage })));
const SegmentsPage = lazy(() => import('@/pages/customer-segments/SegmentsPage').then((m) => ({ default: m.SegmentsPage })));
const CleanupPage = lazy(() => import('@/pages/cleanup/CleanupPage').then((m) => ({ default: m.CleanupPage })));
const CacheAdminPage = lazy(() => import('@/pages/system/CacheAdminPage').then((m) => ({ default: m.CacheAdminPage })));
const QueueAdminPage = lazy(() => import('@/pages/system/QueueAdminPage').then((m) => ({ default: m.QueueAdminPage })));
const PerfAdminPage = lazy(() => import('@/pages/system/PerfAdminPage').then((m) => ({ default: m.PerfAdminPage })));
const SearchAdminPage = lazy(() => import('@/pages/system/SearchAdminPage').then((m) => ({ default: m.SearchAdminPage })));
const RealtimeAdminPage = lazy(() => import('@/pages/system/RealtimeAdminPage').then((m) => ({ default: m.RealtimeAdminPage })));
const ObservabilityPage = lazy(() => import('@/pages/system/ObservabilityPage').then((m) => ({ default: m.ObservabilityPage })));
const ImportHistoryPage = lazy(() => import('@/pages/import/ImportHistoryPage').then((m) => ({ default: m.ImportHistoryPage })));
const StoragePage = lazy(() => import('@/pages/storage/StoragePage').then((m) => ({ default: m.StoragePage })));
const TasksPage = lazy(() => import('@/pages/tasks/TasksPage').then((m) => ({ default: m.TasksPage })));
const SupportCenterPage = lazy(() => import('@/pages/support/SupportCenterPage').then((m) => ({ default: m.SupportCenterPage })));
const CompanyProfilePage = lazy(() => import('@/pages/settings/sections/CompanyProfilePage').then((m) => ({ default: m.CompanyProfilePage })));

function withSuspense(node: ReactNode) {
  return <Suspense fallback={<LoadingState size="lg" />}>{node}</Suspense>;
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="card p-8 text-center">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-on-surface-variant mt-2">Bu modül ilerideki fazlarda eklenecek.</p>
    </div>
  );
}

const routes: RouteObject[] = [
  {
    path: '/login',
    element: (
      <AuthLayout>
        {withSuspense(<LoginPage />)}
      </AuthLayout>
    ),
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: withSuspense(<DashboardPage />) },
      // Süper Admin
      { path: 'super-admin/dashboard', element: withSuspense(<SuperAdminDashboardPage />) },
      { path: 'super-admin/tenants', element: withSuspense(<TenantsPage />) },
      { path: 'super-admin/tenants/:id', element: withSuspense(<TenantDetailPage />) },
      { path: 'super-admin/tenants/:id/plans', element: withSuspense(<TenantPlansPage />) },
      { path: 'super-admin/users', element: withSuspense(<UsersPage />) },
      { path: 'super-admin/plans', element: withSuspense(<PlansPage />) },
      { path: 'super-admin/modules', element: withSuspense(<ModulesPage />) },
      { path: 'super-admin/logs', element: withSuspense(<SuperAdminLogsPage />) },
      // Operasyonel modüller (FAZ 6+)
      { path: 'customers', element: withSuspense(<CustomerListPage />) },
      { path: 'customers/new', element: withSuspense(<CustomerNewPage />) },
      { path: 'customers/:id', element: withSuspense(<CustomerDetailPage />) },
      { path: 'customers/:id/movements/:movementId', element: withSuspense(<CustomerMovementDetailPage />) },
      { path: 'products', element: withSuspense(<ProductListPage />) },
      { path: 'products/new', element: withSuspense(<ProductNewPage />) },
      { path: 'products/:id', element: withSuspense(<ProductDetailPage />) },
      { path: 'products/:id/edit', element: withSuspense(<ProductNewPage />) },
      { path: 'warehouses', element: withSuspense(<WarehouseListPage />) },

      // FAZ 21 — İade Yönetimi route'ları
      { path: 'returns', element: withSuspense(<ReturnListPage />) },
      { path: 'returns/new', element: withSuspense(<ReturnFormPage />) },
      { path: 'returns/approval', element: withSuspense(<ReturnApprovalPage />) },
      { path: 'returns/:id', element: withSuspense(<ReturnDetailPage />) },
      { path: 'returns/:id/edit', element: withSuspense(<ReturnFormPage />) },

      // FAZ 22 — Banka & POS route'ları
      { path: 'banks/accounts', element: withSuspense(<BankAccountsPage />) },
      { path: 'banks/accounts/new', element: withSuspense(<BankAccountFormPage />) },
      { path: 'banks/accounts/:id', element: withSuspense(<BankAccountFormPage />) },
      { path: 'banks/accounts/:id/edit', element: withSuspense(<BankAccountFormPage />) },
      { path: 'banks/transactions', element: withSuspense(<BankTransactionsPage />) },
      { path: 'banks/transactions/new', element: withSuspense(<BankTransactionNewPage />) },
      { path: 'banks/pos-devices', element: withSuspense(<PosDevicesPage />) },
      { path: 'banks/pos-collections', element: withSuspense(<PosCollectionsPage />) },
      { path: 'banks/pos-commission', element: withSuspense(<PosCommissionPage />) },

      // FAZ 24 — Veri Taşıma/Geçiş
      { path: 'import/wizard', element: withSuspense(<ImportWizardPage />) },
      { path: 'import/wizard/:id', element: withSuspense(<ImportWizardPage />) },
      { path: 'import/history', element: withSuspense(<ImportHistoryPage />) },

      // FAZ 25 — API & Webhook route'ları
      { path: 'api/keys', element: withSuspense(<ApiKeysPage />) },
      { path: 'api/usage', element: withSuspense(<UsageLogsPage />) },
      { path: 'api/webhooks', element: withSuspense(<WebhooksPage />) },
      { path: 'api/webhooks/:id/deliveries', element: withSuspense(<DeliveriesPage />) },
      { path: 'api/deliveries', element: withSuspense(<DeliveriesPage />) },

      // FAZ 26 — Asistan KB
      { path: 'assistant/articles', element: withSuspense(<AssistantArticlesPage />) },
      { path: 'assistant/articles/new', element: withSuspense(<AssistantArticleFormPage />) },
      { path: 'assistant/articles/:id/edit', element: withSuspense(<AssistantArticleFormPage />) },
      { path: 'assistant/tools', element: withSuspense(<AssistantToolsPage />) },
      { path: 'white-label', element: withSuspense(<WhiteLabelPage />) },
      { path: 'monitoring', element: withSuspense(<MonitoringPage />) },
      { path: 'monitoring/logs', element: withSuspense(<ErrorLogsPage />) },

      // FAZ 29 — Fiyat Listesi / Kampanya
      { path: 'pricing/price-lists', element: withSuspense(<PriceListsPage />) },
      { path: 'pricing/price-lists/new', element: withSuspense(<PriceListFormPage />) },
      { path: 'pricing/price-lists/:id', element: withSuspense(<PriceListFormPage />) },
      { path: 'pricing/price-lists/:id/edit', element: withSuspense(<PriceListFormPage />) },
      { path: 'pricing/customer-groups', element: withSuspense(<CustomerGroupsPage />) },
      { path: 'pricing/campaigns', element: withSuspense(<CampaignsPage />) },
      { path: 'pricing/campaigns/new', element: withSuspense(<CampaignFormPage />) },
      { path: 'pricing/campaigns/:id/edit', element: withSuspense(<CampaignFormPage />) },
      { path: 'pricing/campaigns/:id/test', element: withSuspense(<CampaignTestPage />) },

      // FAZ 30 — Şablon route'ları
      { path: 'templates', element: withSuspense(<TemplatesListPage />) },
      { path: 'templates/new', element: withSuspense(<TemplateFormPage />) },
      { path: 'templates/:id/edit', element: withSuspense(<TemplateFormPage />) },
      { path: 'templates/:id/preview', element: withSuspense(<TemplatePreviewPage />) },
      { path: 'templates/defaults', element: withSuspense(<TemplateDefaultsPage />) },

      // FAZ 31 — Rapor route'ları
      { path: 'reports', element: withSuspense(<ReportsHomePage />) },
      { path: 'reports/designer', element: withSuspense(<PivotDesignerPage />) },
      { path: 'reports/templates', element: withSuspense(<ReportTemplatesPage />) },
      { path: 'reports/scheduled', element: withSuspense(<ScheduledReportsPage />) },

      // FAZ 32 — Bildirim routes
      { path: 'notifications/inbox', element: withSuspense(<NotificationCenterPage />) },
      { path: 'notifications/rules', element: withSuspense(<NotificationRulesPage />) },
      { path: 'notifications/rules/new', element: withSuspense(<NotificationRuleFormPage />) },
      { path: 'notifications/rules/:id/edit', element: withSuspense(<NotificationRuleFormPage />) },
      { path: 'notifications/channels', element: withSuspense(<NotificationChannelsPage />) },
      { path: 'notifications/channels/new', element: withSuspense(<NotificationChannelFormPage />) },
      { path: 'notifications/channels/:id/edit', element: withSuspense(<NotificationChannelFormPage />) },
      { path: 'notifications/logs', element: withSuspense(<NotificationLogsPage />) },

      // FAZ 33 — Onay routes
      { path: 'approvals', element: withSuspense(<ApprovalsHomePage />) },
      { path: 'approvals/rules', element: withSuspense(<ApprovalRulesPage />) },
      { path: 'approvals/rules/new', element: withSuspense(<ApprovalRuleFormPage />) },
      { path: 'approvals/rules/:id/edit', element: withSuspense(<ApprovalRuleFormPage />) },
      { path: 'approvals/requests', element: withSuspense(<ApprovalRequestsPage />) },
      { path: 'approvals/requests/:id', element: withSuspense(<ApprovalRequestDetailPage />) },

      // FAZ 34 — Denetim routes
      { path: 'audit', element: withSuspense(<AuditHomePage />) },
      { path: 'audit/rules', element: withSuspense(<AuditRulesPage />) },
      { path: 'audit/rules/new', element: withSuspense(<AuditRuleFormPage />) },
      { path: 'audit/rules/:id/edit', element: withSuspense(<AuditRuleFormPage />) },
      { path: 'audit/runs', element: withSuspense(<AuditRunsPage />) },
      { path: 'audit/runs/:id', element: withSuspense(<AuditRunDetailPage />) },
      { path: 'audit/results', element: withSuspense(<AuditResultsPage />) },
      { path: 'audit/results/:id', element: withSuspense(<AuditResultDetailPage />) },
      { path: 'audit/stats', element: withSuspense(<AuditStatsPage />) },
      { path: 'audit/schedules', element: withSuspense(<AuditSchedulesPage />) },
      { path: 'audit/logs', element: withSuspense(<AuditLogsPage />) },

      // FAZ 35 — AI Asistan routes
      { path: 'assistant-chat', element: withSuspense(<ChatHomePage />) },
      { path: 'assistant-chat/session/:id', element: withSuspense(<ChatSessionPage />) },
      { path: 'assistant-chat/config', element: withSuspense(<LLMConfigPage />) },
      { path: 'assistant-chat/stats', element: withSuspense(<ChatStatsPage />) },

      // FAZ 36 — Süper Admin AI routes
      { path: 'super-admin/ai', element: withSuspense(<AIDashboardPage />) },
      { path: 'super-admin/ai/conversations', element: withSuspense(<AIConversationsPage />) },
      { path: 'super-admin/ai/conversations/:id', element: withSuspense(<AIConversationDetailPage />) },
      { path: 'super-admin/ai/training', element: withSuspense(<AITrainingDataPage />) },

      // FAZ 39-43 routes
      { path: 'onboarding', element: withSuspense(<OnboardingWizardPage />) },
      { path: 'industry-templates', element: withSuspense(<IndustryTemplatesPage />) },
      { path: 'demo-company', element: withSuspense(<DemoCompanyPage />) },
      { path: 'visits/plans', element: withSuspense(<VisitsPlansPage />) },
      { path: 'visits/plans/new', element: withSuspense(<VisitPlanFormPage />) },
      { path: 'visits/plans/:id', element: withSuspense(<VisitPlanDetailPage />) },
      { path: 'performance/targets', element: withSuspense(<TargetsPage />) },
      { path: 'performance/targets/new', element: withSuspense(<TargetFormPage />) },
      { path: 'performance/commissions', element: withSuspense(<CommissionsPage />) },
      { path: 'quotes', element: withSuspense(<QuotesListPage />) },
      { path: 'quotes/new', element: withSuspense(<QuoteFormPage />) },
      { path: 'quotes/:id', element: withSuspense(<QuoteDetailPage />) },
      { path: 'customer-risk', element: withSuspense(<CustomerRiskPage />) },
      { path: 'customer-risk/config', element: withSuspense(<RiskConfigPage />) },
      { path: 'bulk-operations', element: withSuspense(<BulkOperationsPage />) },
      { path: 'labels', element: withSuspense(<LabelsPage />) },
      { path: 'product-images', element: withSuspense(<ProductImagesPage />) },
      { path: 'customer-segments', element: withSuspense(<SegmentsPage />) },
      { path: 'cleanup', element: withSuspense(<CleanupPage />) },
      { path: 'system/cache', element: withSuspense(<CacheAdminPage />) },
      { path: 'system/queues', element: withSuspense(<QueueAdminPage />) },
      { path: 'system/perf', element: withSuspense(<PerfAdminPage />) },
      { path: 'system/search', element: withSuspense(<SearchAdminPage />) },
      { path: 'system/realtime', element: withSuspense(<RealtimeAdminPage />) },
      { path: 'system/observability', element: withSuspense(<ObservabilityPage />) },

      // FAZ 23 — Bayi/Müşteri Portalı route'ları (public + ayrı auth)
      { path: 'portal/login', element: withSuspense(<PortalLoginPage />) },
      {
        path: 'portal',
        element: withSuspense(<PortalLayout />),
        children: [
          { index: true, element: withSuspense(<PortalDashboardPage />) },
          { path: 'catalog', element: withSuspense(<PortalCatalogPage />) },
          { path: 'products/:id', element: withSuspense(<PortalProductDetailPage />) },
          { path: 'cart', element: withSuspense(<PortalCartPage />) },
          { path: 'orders', element: withSuspense(<PortalOrdersPage />) },
          { path: 'orders/:id', element: withSuspense(<PortalOrderDetailPage />) },
          { path: 'statement', element: withSuspense(<PortalStatementPage />) },
          { path: 'profile', element: withSuspense(<PortalProfilePage />) },
        ],
      },
      { path: 'warehouses/new', element: withSuspense(<WarehouseFormPage />) },
      { path: 'warehouses/transfer', element: withSuspense(<WarehouseTransferPage />) },
      { path: 'warehouses/:id', element: withSuspense(<WarehouseDetailPage />) },
      { path: 'warehouses/:id/edit', element: withSuspense(<WarehouseFormPage />) },
      { path: 'warehouses/:id/stock', element: withSuspense(<WarehouseStockPage />) },
      { path: 'warehouses/:id/movements', element: withSuspense(<WarehouseMovementsPage />) },
      { path: 'stock/movements', element: withSuspense(<StockMovementsPage />) },
      // FAZ 8 — Satış Modülü
      { path: 'sales', element: withSuspense(<SaleListPage />) },
      { path: 'sales/new', element: withSuspense(<SaleNewPage />) },
      { path: 'sales/:id', element: withSuspense(<SaleDetailPage />) },
      { path: 'sales/:id/edit', element: withSuspense(<SaleNewPage />) },
      // FAZ 9 — Sipariş Modülü
      { path: 'orders', element: withSuspense(<OrderListPage />) },
      { path: 'orders/new', element: withSuspense(<OrderNewPage />) },
      { path: 'orders/:id', element: withSuspense(<OrderDetailPage />) },
// FAZ 10 — Tahsilat Modülü
      { path: 'collections', element: withSuspense(<CollectionListPage />) },
      { path: 'collections/new', element: withSuspense(<CollectionNewPage />) },
      { path: 'collections/:id', element: withSuspense(<CollectionDetailPage />) },
      { path: 'collections/:id/edit', element: withSuspense(<CollectionNewPage />) },
      // Alış Faturaları
      { path: 'purchase-invoices', element: withSuspense(<PurchaseInvoiceListPage />) },
      { path: 'purchase-invoices/new', element: withSuspense(<PurchaseInvoiceFormPage />) },
      { path: 'purchase-invoices/:id', element: withSuspense(<PurchaseInvoiceDetailPage />) },
      { path: 'purchase-invoices/:id/edit', element: withSuspense(<PurchaseInvoiceFormPage />) },
      // FAZ 11 — Kasa Modülü
      { path: 'cash', element: withSuspense(<CashListPage />) },
      { path: 'cash/:id', element: withSuspense(<CashDetailPage />) },
      // FAZ 12 — Raporlar Modülü
      { path: 'stock-counts', element: withSuspense(<StockCountListPage />) },
      { path: 'stock-counts/new', element: withSuspense(<StockCountNewPage />) },
      { path: 'stock-counts/:id', element: withSuspense(<StockCountDetailPage />) },
      { path: 'stock-counts/:id/barcode', element: withSuspense(<StockCountBarcodePage />) },
      { path: 'stock-counts/:id/differences', element: withSuspense(<StockCountDifferencesPage />) },
      { path: 'stock-counts/:id/approval', element: withSuspense(<StockCountApprovalPage />) },
      { path: 'notifications', element: withSuspense(<NotificationsPage />) },
      // FAZ HR-1 — İK Personel Özlük Kartı
      { path: 'hr/employees', element: withSuspense(<EmployeeListPage />) },
      { path: 'hr/employees/new', element: withSuspense(<EmployeeFormPage />) },
      { path: 'hr/employees/:id', element: withSuspense(<EmployeeDetailPage />) },
      { path: 'hr/employees/:id/edit', element: withSuspense(<EmployeeFormPage />) },
      // FAZ HR-2 — İşe Giriş/Çıkış Checklist
      { path: 'hr/checklists/onboardings', element: withSuspense(<OnboardingListPage />) },
      { path: 'hr/checklists/onboardings/:id', element: withSuspense(<OnboardingChecklistPage />) },
      { path: 'hr/checklists/offboardings', element: withSuspense(<OffboardingListPage />) },
      { path: 'hr/checklists/offboardings/:id', element: withSuspense(<OffboardingChecklistPage />) },
      // FAZ HR-3 — İzin Yönetimi
      { path: 'hr/leave/types', element: withSuspense(<LeaveTypesPage />) },
      { path: 'hr/leave/requests', element: withSuspense(<LeaveRequestsPage />) },
      { path: 'hr/leave/requests/new', element: withSuspense(<LeaveRequestFormPage />) },
      { path: 'hr/leave/requests/:id', element: withSuspense(<LeaveRequestDetailPage />) },
      // FAZ HR-4 — Bordro Hazırlık
      { path: 'hr/payroll', element: withSuspense(<PayrollPeriodsPage />) },
      { path: 'hr/payroll/:id', element: withSuspense(<PayrollDetailPage />) },
      // HR-5/6/7
      { path: 'hr/payroll-params', element: withSuspense(<PayrollParamsPage />) },
      { path: 'hr/hr567', element: withSuspense(<HR567Page />) },
      // HR-8/9/10 — Puantaj, Avans, Excel Export
      { path: 'hr/hr8910', element: withSuspense(<HR8910Page />) },
      // 2. PAKET — Yeni Ekranlar (import, storage, tasks, support)
      { path: 'import', element: withSuspense(<ImportWizardPage />) },
      { path: 'storage', element: withSuspense(<StoragePage />) },
      { path: 'tasks', element: withSuspense(<TasksPage />) },
      { path: 'support', element: withSuspense(<SupportCenterPage />) },
      // Ayarlar (SettingsLayout altında)
      {
        path: 'settings',
        element: withSuspense(<SettingsLayout />),
        children: [
          { index: true, element: withSuspense(<SettingsOverviewPage />) },
          { path: 'profile', element: withSuspense(<CompanyProfilePage />) },
          { path: 'subscription', element: withSuspense(<SettingsSubscriptionPage />) },
          { path: 'modules', element: withSuspense(<SettingsModulesPage />) },
          { path: 'users', element: withSuspense(<SettingsUsersPage />) },
          { path: 'roles', element: withSuspense(<SettingsRolesPage />) },
          { path: 'logs', element: withSuspense(<SettingsLogsPage />) },
        ],
      },
      { path: '403', element: withSuspense(<ForbiddenPage />) },
      { path: '*', element: withSuspense(<NotFoundPage />) },
    ],
  },
];

export const router = createBrowserRouter(routes);
