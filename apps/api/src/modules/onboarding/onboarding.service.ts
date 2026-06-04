import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';
import { OnboardingStep, OnboardingStatus } from '@saas/shared';

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async getProgress(tenantId: string) {
    let p = await this.prisma.client.onboardingProgress.findUnique({ where: { tenantId } });
    if (!p) p = await this.prisma.client.onboardingProgress.create({ data: { tenantId, data: {} as any } });
    return p;
  }

  async start(tenantId: string, userId: string) {
    const p = await this.getProgress(tenantId);
    if (p.status === OnboardingStatus.COMPLETED) throw new BadRequestException('Onboarding zaten tamamlanmış');
    return this.prisma.client.onboardingProgress.update({
      where: { tenantId },
      data: { status: OnboardingStatus.IN_PROGRESS, startedAt: new Date(), startedById: userId, currentStep: OnboardingStep.COMPANY_INFO },
    });
  }

  async saveStepData(tenantId: string, step: OnboardingStep, data: any) {
    const p = await this.getProgress(tenantId);
    const merged = { ...(p.data as any), [this.stepToKey(step)]: data };
    return this.prisma.client.onboardingProgress.update({
      where: { tenantId },
      data: { data: merged as any, currentStep: step, status: OnboardingStatus.IN_PROGRESS },
    });
  }

  async completeStep(tenantId: string, step: OnboardingStep, userId: string) {
    const p = await this.getProgress(tenantId);
    if (!(p.completedSteps as any[]).includes(step)) {
      const completed = [...(p.completedSteps as any[]), step];
      await this.prisma.client.onboardingStepLog.create({ data: { tenantId, progressId: p.id, step, action: 'COMPLETED' } });
      const nextStep = this.getNextStep(step);
      return this.prisma.client.onboardingProgress.update({
        where: { tenantId },
        data: { completedSteps: completed as any, currentStep: nextStep ?? step, status: nextStep === OnboardingStep.COMPLETED ? OnboardingStatus.COMPLETED : OnboardingStatus.IN_PROGRESS, completedAt: nextStep === OnboardingStep.COMPLETED ? new Date() : null, completedById: nextStep === OnboardingStep.COMPLETED ? userId : null },
      });
    }
    return p;
  }

  async skipStep(tenantId: string, step: OnboardingStep, userId: string) {
    const p = await this.getProgress(tenantId);
    await this.prisma.client.onboardingStepLog.create({ data: { tenantId, progressId: p.id, step, action: 'SKIPPED' } });
    const skipped = [...(p.skippedSteps as any[]), step];
    return this.prisma.client.onboardingProgress.update({ where: { tenantId }, data: { skippedSteps: skipped as any, currentStep: this.getNextStep(step) ?? step } });
  }

  async back(tenantId: string, step: OnboardingStep) {
    await this.prisma.client.onboardingStepLog.create({ data: { tenantId, progressId: (await this.getProgress(tenantId)).id, step, action: 'BACK' } });
    return this.prisma.client.onboardingProgress.update({ where: { tenantId }, data: { currentStep: this.getPrevStep(step) ?? step } });
  }

  async completeAll(tenantId: string, userId: string) {
    return this.prisma.client.onboardingProgress.update({ where: { tenantId }, data: { status: OnboardingStatus.COMPLETED, completedAt: new Date(), completedById: userId, currentStep: OnboardingStep.COMPLETED } });
  }

  private getNextStep(current: OnboardingStep): OnboardingStep | null {
    const order: OnboardingStep[] = [OnboardingStep.START, OnboardingStep.COMPANY_INFO, OnboardingStep.BRAND, OnboardingStep.BRANCHES, OnboardingStep.WAREHOUSES, OnboardingStep.CASH_ACCOUNTS, OnboardingStep.BANKS, OnboardingStep.USER_INVITES, OnboardingStep.PERMISSION_TEMPLATE, OnboardingStep.DATA_IMPORT, OnboardingStep.FIRST_SALE_TEST, OnboardingStep.COMPLETED];
    const idx = order.indexOf(current);
    return idx < order.length - 1 ? order[idx + 1] : null;
  }
  private getPrevStep(current: OnboardingStep): OnboardingStep | null {
    const order: OnboardingStep[] = [OnboardingStep.START, OnboardingStep.COMPANY_INFO, OnboardingStep.BRAND, OnboardingStep.BRANCHES, OnboardingStep.WAREHOUSES, OnboardingStep.CASH_ACCOUNTS, OnboardingStep.BANKS, OnboardingStep.USER_INVITES, OnboardingStep.PERMISSION_TEMPLATE, OnboardingStep.DATA_IMPORT, OnboardingStep.FIRST_SALE_TEST, OnboardingStep.COMPLETED];
    const idx = order.indexOf(current);
    return idx > 0 ? order[idx - 1] : null;
  }
  private stepToKey(step: OnboardingStep): string {
    return step.toLowerCase().replace(/_/g, '');
  }
}
