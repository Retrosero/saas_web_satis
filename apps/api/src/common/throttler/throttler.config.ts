import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { Module, Global } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

@Global()
@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },     // 10 req/sec
      { name: 'medium', ttl: 60_000, limit: 100 }, // 100 req/min
      { name: 'long', ttl: 3600_000, limit: 1000 }, // 1000 req/hour
    ]),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
  exports: [ThrottlerModule],
})
export class ThrottlerConfigModule {}

// Plan bazlı limit
export const PLAN_LIMITS: Record<string, { perMinute: number; perHour: number }> = {
  starter: { perMinute: 60, perHour: 500 },
  pro: { perMinute: 300, perHour: 5000 },
  enterprise: { perMinute: 1000, perHour: 20000 },
  super_admin: { perMinute: 5000, perHour: 100000 },
};

export function getPlanLimit(plan: string) { return PLAN_LIMITS[plan] ?? PLAN_LIMITS['starter']; }
