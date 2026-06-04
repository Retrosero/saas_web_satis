import { Module } from '@nestjs/common';
import { CollectionsController } from './collections.controller.js';
import { CollectionsService } from './collections.service.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [CollectionsController],
  providers: [CollectionsService],
})
export class CollectionsModule {}
