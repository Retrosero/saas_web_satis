import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { WhiteLabelService } from './white-label.service.js';
import type { JwtPayload, WhiteLabelSettings } from '@saas/shared';

@ApiTags('white-label')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('white-label')
export class WhiteLabelController {
  constructor(private readonly svc: WhiteLabelService) {}

  @Get()
  @ApiOperation({ summary: 'White-label ayarları' })
  get(@CurrentUser() u: JwtPayload) {
    return this.svc.getSettings(u.tid);
  }

  @Post()
  @ApiOperation({ summary: 'White-label ayarları güncelle' })
  update(@CurrentUser() u: JwtPayload, @Body() body: Partial<WhiteLabelSettings>) {
    return this.svc.updateSettings(u.tid, body);
  }

  @Post('validate-domain')
  @ApiOperation({ summary: 'Özel domain doğrula' })
  validateDomain(@CurrentUser() u: JwtPayload, @Body() body: { domain: string }) {
    return this.svc.validateDomain(u.tid, body.domain);
  }
}
