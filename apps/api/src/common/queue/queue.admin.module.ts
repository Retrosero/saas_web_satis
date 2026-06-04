import { Module } from '@nestjs/common';
import { QueueModule } from './queue.module';
import { QueueService } from './queue.service';
import { MailProcessor, ReportProcessor, BulkProcessor } from './queue.processor';
import { QueueAdminController } from './queue.controllers';

@Module({
  imports: [QueueModule],
  controllers: [QueueAdminController],
  providers: [QueueService, MailProcessor, ReportProcessor, BulkProcessor],
  exports: [QueueService],
})
export class QueueAdminModule {}
