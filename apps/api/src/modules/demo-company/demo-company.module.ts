import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { DemoCompanyController } from './demo-company.controller';
import { DemoCompanyService } from './demo-company.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({ imports: [PrismaModule], controllers: [DemoCompanyController], providers: [DemoCompanyService], exports: [DemoCompanyService] })
export class DemoCompanyModule implements OnModuleInit {
  private readonly logger = new Logger(DemoCompanyModule.name);
  constructor(private readonly svc: DemoCompanyService) {}
  async onModuleInit() {
    try { await this.svc.seedDemoTemplates(); this.logger.log('Demo şablonları seed edildi'); } catch (e: any) { this.logger.warn(`Seed: ${e.message}`); }
  }
}
