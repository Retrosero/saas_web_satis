import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { SentryInterceptor } from './sentry.interceptor';
import { ObservabilityController } from './observability.controller';

@Global()
@Module({
  controllers: [ObservabilityController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: SentryInterceptor }],
  exports: [],
})
export class ObservabilityModule {}
