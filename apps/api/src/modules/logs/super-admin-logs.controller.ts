import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { LogsService } from './logs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { RiskLevel } from '@saas/shared';

@ApiTags('super-admin-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('super-admin/logs')
export class SuperAdminLogsController {
  constructor(private readonly logs: LogsService) {}

  @Get('audit')
  @ApiOperation({ summary: 'Sistem audit logları (süper admin — tüm tenant)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'module', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'riskLevel', required: false, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'entityType', required: false, type: String })
  @ApiQuery({ name: 'tenantId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async audit(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
    @Query('module') module?: string,
    @Query('action') action?: string,
    @Query('riskLevel') riskLevel?: RiskLevel,
    @Query('userId') userId?: string,
    @Query('entityType') entityType?: string,
    @Query('tenantId') tenantId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.logs.listAuditLogs({
      tenantId: tenantId === undefined ? undefined : tenantId || null,
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

  @Get('audit/stats')
  @ApiOperation({ summary: 'Audit log istatistikleri (son 24 saat)' })
  async auditStats(@Query('tenantId') tenantId?: string) {
    return this.logs.getAuditLogStats(tenantId === undefined ? undefined : tenantId || null);
  }

  @Get('error')
  @ApiOperation({ summary: 'Sistem hata logları' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'level', required: false, type: String })
  @ApiQuery({ name: 'path', required: false, type: String })
  @ApiQuery({ name: 'statusCode', required: false, type: Number })
  @ApiQuery({ name: 'tenantId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async error(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
    @Query('level') level?: string,
    @Query('path') path?: string,
    @Query('statusCode') statusCode?: string,
    @Query('tenantId') tenantId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.logs.listErrorLogs({
      tenantId: tenantId === undefined ? undefined : tenantId || null,
      page: Number(page),
      pageSize: Number(pageSize),
      level,
      path,
      statusCode: statusCode ? Number(statusCode) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('security')
  @ApiOperation({ summary: 'Güvenlik logları' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'event', required: false, type: String })
  @ApiQuery({ name: 'riskLevel', required: false, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'ipAddress', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async security(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
    @Query('event') event?: string,
    @Query('riskLevel') riskLevel?: RiskLevel,
    @Query('userId') userId?: string,
    @Query('ipAddress') ipAddress?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.logs.listSecurityLogs({
      page: Number(page),
      pageSize: Number(pageSize),
      event,
      riskLevel,
      userId,
      ipAddress,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }
}
