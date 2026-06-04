import { Controller, Get, Delete, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { QueryLoggerService } from './query-logger.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('perf-admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('perf-admin')
export class PerfAdminController {
  constructor(private readonly logger: QueryLoggerService) {}
  @Get('queries/stats') stats() { return this.logger.getStats(); }
  @Get('queries/recent') recent(@Query() q: any) { return this.logger.getRecent(q.limit ? Number(q.limit) : 50); }
  @Get('queries/slow') slow(@Query() q: any) { return this.logger.getSlow(q.limit ? Number(q.limit) : 30); }
  @Delete('queries/clear') clear() { this.logger.clear(); return { ok: true }; }
}
