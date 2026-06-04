import { Controller, Get, Post, UseGuards, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Sentry } from '../../instrument';

@ApiTags('observability')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('observability')
export class ObservabilityController {
  @Get('health')
  health() {
    return {
      otel: true,
      sentry: !!process.env.SENTRY_DSN,
      env: process.env.NODE_ENV ?? 'development',
      version: process.env.APP_VERSION ?? 'dev',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('test-error')
  testError(@Body() body: { type?: 'sentry' | 'unhandled' | 'http' }) {
    const t = body?.type ?? 'sentry';
    if (t === 'sentry') {
      Sentry.captureMessage('Test mesajı: ' + Date.now(), 'info');
      return { ok: true, sentryEventSent: true };
    }
    if (t === 'http') throw new Error('Test HTTP hatası');
    throw new Error('Unhandled test hatası: ' + Date.now());
  }
}
