import { Module } from '@nestjs/common';
import { BulkOperationsController } from './bulk-operations.controller';
import { BulkOperationsService } from './bulk-operations.service';
import { PrismaModule } from '../../prisma/prisma.module';
@Module({ imports: [PrismaModule], controllers: [BulkOperationsController], providers: [BulkOperationsService], exports: [BulkOperationsService] })
export class BulkOperationsModule {}
