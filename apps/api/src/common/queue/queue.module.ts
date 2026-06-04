import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

export const QUEUE_MAIL = 'mail';
export const QUEUE_REPORT = 'report';
export const QUEUE_BULK = 'bulk';

export interface BaseJobData {
  tenantId?: string;
  userId?: string;
  triggeredBy?: 'api' | 'cron' | 'system';
  traceId?: string;
}

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_HOST ?? 'localhost',
          port: Number(process.env.REDIS_PORT ?? 6379),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { age: 7 * 24 * 3600, count: 1000 },
          removeOnFail: { age: 30 * 24 * 3600, count: 5000 },
        },
      }),
    }),
    BullModule.registerQueue({ name: QUEUE_MAIL }, { name: QUEUE_REPORT }, { name: QUEUE_BULK }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
