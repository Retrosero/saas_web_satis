import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { StockModule } from './modules/stock/stock.module';
import { SalesModule } from './modules/sales/sales.module';
import { OrdersModule } from './modules/orders/orders.module';
import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { r2Config } from './config/r2.config';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig, databaseConfig, jwtConfig, r2Config],
      envFilePath: ['.env.local', '.env', '../../.env'],
    }),

    // Logger (Pino)
    LoggerModule.forRootAsync({
      useFactory: () => ({
        pinoHttp: {
          level: process.env.LOG_LEVEL ?? 'info',
          transport:
            process.env.NODE_ENV !== 'production'
              ? { target: 'pino-pretty', options: { singleLine: true, colorize: true } }
              : undefined,
          redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.passwordHash', '*.token', '*.apiKey', '*.secret'],
        },
      }),
    }),

    // Rate limit
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.THROTTLE_TTL ?? 60) * 1000,
        limit: Number(process.env.THROTTLE_LIMIT ?? 100),
      },
    ]),

    // DB
    PrismaModule,

    // Feature modülleri
    AuthModule,
    TenantsModule,
    SuperAdminModule,
    HealthModule,
    NotificationsModule,
    TenantAdminModule,
    LogsModule,
    CustomersModule,
    ProductsModule,
    WarehousesModule,
    StockModule,
    SalesModule,
    OrdersModule,
  ],
})
export class AppModule {}
