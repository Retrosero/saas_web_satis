import { Module } from '@nestjs/common';
import { CustomerRiskController } from './customer-risk.controller';
import { CustomerRiskService } from './customer-risk.service';
import { PrismaModule } from '../../prisma/prisma.module';
@Module({ imports: [PrismaModule], controllers: [CustomerRiskController], providers: [CustomerRiskService], exports: [CustomerRiskService] })
export class CustomerRiskModule {}
