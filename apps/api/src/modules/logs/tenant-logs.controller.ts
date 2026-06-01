import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { LogsService } from './logs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload, RiskLevel } from '@saas/shared';

@ApiTags('tenant-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('settings/logs')
export class TenantLogsController {
  constructor(private readonly logs: LogsService) {}

  @Get('audit')
  @ApiOperation({ summary: 'Tenant audit logları (kendi tenant)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'module', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'riskLevel', required: false, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'entityType', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async audit(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
    @Query('module') module?: string,
    @Query('action') action?: string,
    @Query('riskLevel') riskLevel?: RiskLevel,
    @Query('userId') userId?: string,
    @Query('entityType') entityType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.logs.listAuditLogs({
      tenantId: user.tid,
      page: Number(page),
      pageSize: Number(pageSize),
      module,
      action,
      riskLevel,
      userId,
      entityType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('security')
  @ApiOperation({ summary: 'Tenant güvenlik logları (kendi tenant)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'event', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'ipAddress', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async security(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
    @Query('event') event?: string,
    @Query('userId') userId?: string,
    @Query('ipAddress') ipAddress?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.logs.listSecurityLogs({
      tenantId: user.tid,
      page: Number(page),
      pageSize: Number(pageSize),
      event,
      userId,
      ipAddress,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }
}
