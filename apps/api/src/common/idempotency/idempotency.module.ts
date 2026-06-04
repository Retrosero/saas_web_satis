import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { IdempotencyMiddleware } from './idempotency.schema';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({ imports: [PrismaModule], providers: [IdempotencyMiddleware], exports: [IdempotencyMiddleware] })
export class IdempotencyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(IdempotencyMiddleware).forRoutes('*');
  }
}
