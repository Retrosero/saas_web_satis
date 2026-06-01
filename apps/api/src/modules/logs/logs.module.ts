import { Module } from '@nestjs/common';
import { LogsService } from './logs.service';
import { SuperAdminLogsController } from './super-admin-logs.controller';
import { TenantLogsController } from './tenant-logs.controller';

@Module({
  controllers: [SuperAdminLogsController, TenantLogsController],
  providers: [LogsService],
  exports: [LogsService],
})
export class LogsModule {}
