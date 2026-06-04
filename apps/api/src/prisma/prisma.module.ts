import { Global, Module, OnModuleInit, OnModuleDestroy, Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export const PRISMA_CLIENT = 'PRISMA_CLIENT';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(PRISMA_CLIENT) public readonly client: PrismaClient) {}

  async onModuleInit(): Promise<void> {
    await this.client.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}

@Global()
@Module({
  providers: [
    {
      provide: PRISMA_CLIENT,
      useFactory: () => new PrismaClient(),
    },
    PrismaService,
  ],
  exports: [PRISMA_CLIENT, PrismaService],
})
export class PrismaModule {}
