import { Module, Global } from '@nestjs/common';
import { QueryLoggerService } from './query-logger.service';
import { PerfAdminController } from './perf-admin.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [PerfAdminController],
  providers: [QueryLoggerService],
  exports: [QueryLoggerService],
})
export class PerfModule {}
