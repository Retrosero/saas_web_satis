import { Module } from '@nestjs/common';
import { CustomerSegmentsController } from './customer-segments.controller';
import { CustomerSegmentsService } from './customer-segments.service';
import { PrismaModule } from '../../prisma/prisma.module';
@Module({ imports: [PrismaModule], controllers: [CustomerSegmentsController], providers: [CustomerSegmentsService], exports: [CustomerSegmentsService] })
export class CustomerSegmentsModule {}
