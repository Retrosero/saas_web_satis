import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { IndustryTemplatesController } from './industry-templates.controller';
import { IndustryTemplatesService } from './industry-templates.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({ imports: [PrismaModule], controllers: [IndustryTemplatesController], providers: [IndustryTemplatesService], exports: [IndustryTemplatesService] })
export class IndustryTemplatesModule implements OnModuleInit {
  private readonly logger = new Logger(IndustryTemplatesModule.name);
  constructor(private readonly svc: IndustryTemplatesService) {}
  async onModuleInit() {
    try { await this.svc.seedDefaults(); this.logger.log('Sektör şablonları seed edildi'); } catch (e: any) { this.logger.warn(`Seed hatası: ${e.message}`); }
  }
}
