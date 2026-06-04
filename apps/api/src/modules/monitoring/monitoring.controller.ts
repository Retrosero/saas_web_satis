import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { MonitoringService } from './monitoring.service.js';

@ApiTags('monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly svc: MonitoringService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Sistem sağlığı dashboard' })
  dashboard() { return this.svc.getDashboard(); }

  @Get('api-errors')
  apiErrors() { return this.svc.getApiErrorRates(); }

  @Get('slow-endpoints')
  slowEndpoints() { return this.svc.getSlowEndpoints(); }

  @Get('tenant-errors')
  tenantErrors() { return this.svc.getTenantErrorDensity(); }

  @Get('error-logs')
  errorLogs(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('severity') severity?: string,
    @Query('tenantId') tenantId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.svc.getErrorLogs({
      page: page ? Number(page) : 1, pageSize: pageSize ? Number(pageSize) : 50,
      severity, tenantId,
      from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined,
    });
  }

  @Get('services')
  services() { return this.svc.getServiceStatuses(); }
}
