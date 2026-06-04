import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ReportsService } from './reports.service.js';
import type { JwtPayload, ReportTemplate } from '@saas/shared';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly svc: ReportsService) {}

  @Get('presets')
  @ApiOperation({ summary: 'Hazır raporlar' })
  presets() {
    return this.svc.getPresets();
  }

  @Get('presets/:code')
  @ApiOperation({ summary: 'Hazır raporu çalıştır' })
  async runPreset(@CurrentUser() u: JwtPayload, @Param('code') code: string) {
    const p = this.svc.getPresets().find((x) => x.code === code);
    if (!p) return { error: 'Hazır rapor bulunamadı' };
    return this.svc.execute(u.tid, p.config);
  }

  @Post('execute')
  @ApiOperation({ summary: 'Pivot rapor çalıştır' })
  execute(@CurrentUser() u: JwtPayload, @Body() body: any) {
    return this.svc.execute(u.tid, body);
  }

  @Get('templates')
  templates(@CurrentUser() u: JwtPayload, @Query('isFavorite') isFavorite?: string, @Query('sharedWithMe') sharedWithMe?: string) {
    return this.svc.listTemplates(u.tid, { isFavorite: isFavorite === 'true', sharedWithMe: sharedWithMe === 'true' });
  }

  @Get('templates/:id')
  template(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.getTemplate(u.tid, id);
  }

  @Post('templates')
  createTemplate(@CurrentUser() u: JwtPayload, @Body() body: any) {
    return this.svc.createTemplate(u.tid, body, u.sub);
  }

  @Put('templates/:id')
  updateTemplate(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateTemplate(u.tid, id, body);
  }

  @Delete('templates/:id')
  async deleteTemplate(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    await this.svc.deleteTemplate(u.tid, id);
    return { ok: true };
  }

  @Post('templates/:id/favorite')
  toggleFavorite(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.toggleFavorite(u.tid, id);
  }

  @Get('schedules')
  schedules(@CurrentUser() u: JwtPayload) {
    return this.svc.listSchedules(u.tid);
  }

  @Post('schedules')
  createSchedule(@CurrentUser() u: JwtPayload, @Body() body: any) {
    return this.svc.createSchedule(u.tid, body, u.sub);
  }

  @Post('schedules/:id/toggle')
  toggleSchedule(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.toggleSchedule(u.tid, id);
  }

  @Delete('schedules/:id')
  async deleteSchedule(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    await this.svc.deleteSchedule(u.tid, id);
    return { ok: true };
  }
}
