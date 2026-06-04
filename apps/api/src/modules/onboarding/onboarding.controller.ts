import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { OnboardingService } from './onboarding.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OnboardingStep } from '@saas/shared';

@ApiTags('onboarding')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly svc: OnboardingService) {}

  @Get('progress')
  getProgress(@Req() req: any) { return this.svc.getProgress(req.user.tenantId); }

  @Post('start')
  start(@Req() req: any) { return this.svc.start(req.user.tenantId, req.user.id); }

  @Post('step/:step/data')
  saveStepData(@Req() req: any, @Param('step') step: OnboardingStep, @Body() body: any) { return this.svc.saveStepData(req.user.tenantId, step, body); }

  @Post('step/:step/complete')
  completeStep(@Req() req: any, @Param('step') step: OnboardingStep) { return this.svc.completeStep(req.user.tenantId, step, req.user.id); }

  @Post('step/:step/skip')
  skipStep(@Req() req: any, @Param('step') step: OnboardingStep) { return this.svc.skipStep(req.user.tenantId, step, req.user.id); }

  @Post('step/:step/back')
  back(@Req() req: any, @Param('step') step: OnboardingStep) { return this.svc.back(req.user.tenantId, step); }

  @Post('complete')
  completeAll(@Req() req: any) { return this.svc.completeAll(req.user.tenantId, req.user.id); }
}
