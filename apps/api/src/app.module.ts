import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';
import { HealthModule } from './modules/health/health.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TenantAdminModule } from './modules/tenant-admin/tenant-admin.module';
import { LogsModule } from './modules/logs/logs.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ProductsModule } from './modules/products/products.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { ReturnsModule } from './modules/returns/returns.module';
import { BanksModule } from './modules/banks/banks.module';
import { PortalModule } from './modules/portal/portal.module';
import { ImportModule } from './modules/import/import.module';
import { ApiModule } from './modules/api/api.module';
import { AssistantModule } from './modules/assistant/assistant.module';
import { WhiteLabelModule } from './modules/white-label/white-label.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { ReportsEngineModule as ReportsModule } from './modules/reports/reports-engine.module';
import { NotificationsExtendedModule } from './modules/notifications-extended/notifications-extended.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { AuditModule } from './modules/audit/audit.module';
import { AssistantChatModule } from './modules/assistant-chat/assistant-chat.module';
import { AgentModule } from './modules/assistant-chat/agent/agent.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { IndustryTemplatesModule } from './modules/industry-templates/industry-templates.module';
import { DemoCompanyModule } from './modules/demo-company/demo-company.module';
import { VisitsModule } from './modules/visits/visits.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { GlobalSearchModule } from './modules/global-search/global-search.module';
import { CommandPaletteModule } from './modules/command-palette/command-palette.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { CustomerRiskModule } from './modules/customer-risk/customer-risk.module';
import { ProductRecommendationsModule } from './modules/product-recommendations/product-recommendations.module';
import { BulkOperationsModule } from './modules/bulk-operations/bulk-operations.module';
import { LabelsModule } from './modules/labels/labels.module';
import { ProductImagesModule } from './modules/product-images/product-images.module';
import { CustomerSegmentsModule } from './modules/customer-segments/customer-segments.module';
import { CleanupModule } from './modules/cleanup/cleanup.module';
import { HrModule } from './modules/hr/hr.module';
import { AppCacheModule } from './common/cache/cache.module';
import { CacheAdminModule } from './modules/cache-admin/cache-admin.module';
import { QueueAdminModule } from './common/queue/queue.admin.module';
import { PerfModule } from './common/perf/perf.module';
import { SearchModule } from './common/search/search.module';
import { RealtimeModule } from './common/realtime/realtime.module';
import { ThrottlerConfigModule } from './common/throttler/throttler.config';
import { IdempotencyModule } from './common/idempotency/idempotency.module';
import { ObservabilityModule } from './common/observability/observability.module';
import { IdempotencyAdminController } from './common/idempotency/idempotency-admin.controller';
import { StockModule } from './modules/stock/stock.module';
import { SalesModule } from './modules/sales/sales.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PurchaseInvoicesModule } from './modules/purchase-invoices/purchase-invoices.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { CashModule } from './modules/cash/cash.module';
import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { r2Config } from './config/r2.config';


@Module({
  imports: [
    AppCacheModule,
    DashboardModule,

    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig, databaseConfig, jwtConfig, r2Config],
      envFilePath: ['.env.local', '.env', '../../.env'],
    }),

    // Logger
    LoggerModule.forRootAsync({
      useFactory: () => ({
        pinoHttp: {
          level: process.env.LOG_LEVEL ?? 'info',
          transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty', options: { singleLine: true, colorize: true } } : undefined,
        },
      }),
    }),

    // Throttler
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    PrismaModule,

    // Auth
    AuthModule,

    // Feature
    TenantsModule,
    SuperAdminModule,
    HealthModule,
    NotificationsModule,
    TenantAdminModule,
    LogsModule,
    CustomersModule,
    ProductsModule,
    WarehousesModule,
    SalesModule,
    OrdersModule,
    PurchaseInvoicesModule,
    CollectionsModule,
    CashModule,
    ReturnsModule,
    BanksModule,
    PortalModule,
    ImportModule,
    ApiModule,
    AssistantModule,
    WhiteLabelModule,
    MonitoringModule,
    PricingModule,
    TemplatesModule,
    StockModule,
    ReportsModule,
    NotificationsExtendedModule,
    ApprovalsModule,
    AuditModule,
    AssistantChatModule,
    AgentModule,
    OnboardingModule,
    IndustryTemplatesModule,
    DemoCompanyModule,
    VisitsModule,
    PerformanceModule,
    GlobalSearchModule,
    CommandPaletteModule,
    QuotesModule,
    CustomerRiskModule,
    ProductRecommendationsModule,
    BulkOperationsModule,
    LabelsModule,
    ProductImagesModule,
    CustomerSegmentsModule,
    CleanupModule,
    CacheAdminModule,
    PerfModule,
    SearchModule,
    RealtimeModule,
    ThrottlerConfigModule,
    IdempotencyModule,
    ObservabilityModule,
    QueueAdminModule,
    // FAZ HR-1: İK Personel Özlük Kartı
    HrModule,
  ],
  providers: [],
  exports: [],
})
export class AppModule {}
