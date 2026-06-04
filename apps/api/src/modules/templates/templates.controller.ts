import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { TemplatesService } from './templates.service.js';
import type { DocumentType, JwtPayload, PageFormat } from '@saas/shared';

@ApiTags('templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private readonly svc: TemplatesService) {}

  @Get()
  list(@CurrentUser() u: JwtPayload, @Query('documentType') documentType?: DocumentType, @Query('isActive') isActive?: string) {
    return this.svc.listTemplates(u.tid, { documentType, isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined });
  }

  @Get('variables')
  @ApiOperation({ summary: 'Şablon değişkenleri' })
  variables() {
    const { TEMPLATE_VARIABLES, TEMPLATE_VARIABLE_CATEGORIES } = require('@saas/shared');
    return { variables: TEMPLATE_VARIABLES, categories: TEMPLATE_VARIABLE_CATEGORIES };
  }

  @Get(':id')
  get(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.getTemplate(u.tid, id);
  }

  @Post()
  create(@CurrentUser() u: JwtPayload, @Body() body: any) {
    return this.svc.createTemplate(u.tid, body, u.sub);
  }

  @Put(':id')
  update(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateTemplate(u.tid, id, body);
  }

  @Delete(':id')
  async remove(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    await this.svc.deleteTemplate(u.tid, id);
    return { ok: true };
  }

  @Post(':id/default')
  setDefault(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.setDefault(u.tid, id);
  }

  @Post(':id/duplicate')
  duplicate(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.duplicateTemplate(u.tid, id, u.sub);
  }
}
