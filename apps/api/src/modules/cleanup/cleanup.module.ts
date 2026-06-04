import { Module } from '@nestjs/common';
import { CleanupController } from './cleanup.controller';
import { CleanupService } from './cleanup.service';
import { PrismaModule } from '../../prisma/prisma.module';
@Module({ imports: [PrismaModule], controllers: [CleanupController], providers: [CleanupService], exports: [CleanupService] })
export class CleanupModule {}
