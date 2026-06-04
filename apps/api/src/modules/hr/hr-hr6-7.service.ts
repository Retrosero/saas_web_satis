import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module.js';
import type { JwtPayload } from '@saas/shared';

@Injectable()
export class HrAbsenceService {
  private readonly logger = new Logger(HrAbsenceService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ================== ABSENCE ==================

  async listAbsences(tenantId: string, params: { employeeId?: string; absenceType?: string; startDate?: string; endDate?: string }) {
    const where: any = { tenantId };
    if (params.employeeId) where.employeeId = params.employeeId;
    if (params.absenceType) where.absenceType = params.absenceType as any;
    if (params.startDate || params.endDate) {
      where.startDate = {};
      if (params.startDate) where.startDate.gte = new Date(params.startDate);
      if (params.endDate) where.endDate.lte = new Date(params.endDate);
    }

    const rows = await this.prisma.client.hrAbsenceRecord.findMany({
      where,
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeNo: true } } },
      orderBy: { startDate: 'desc' },
    });

    return rows.map((r) => this.toAbsenceDto(r as any));
  }

  async createAbsence(tenantId: string, input: {
    employeeId: string;
    absenceType: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason?: string;
    isJustified?: boolean;
    deductionAmount?: number;
    periodId?: string;
  }, user: JwtPayload) {
    return this.prisma.client.hrAbsenceRecord.create({
      data: { tenantId, ...input, startDate: new Date(input.startDate as string), endDate: new Date(input.endDate as string), createdBy: user.sub } as any,
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeNo: true } } },
    });
  }

  async updateAbsence(tenantId: string, id: string, input: any) {
    return this.prisma.client.hrAbsenceRecord.update({
      where: { id },
      data: input,
    });
  }

  async deleteAbsence(tenantId: string, id: string) {
    return this.prisma.client.hrAbsenceRecord.delete({ where: { id } });
  }

  // ================== DISCIPLINARY ==================

  async listDisciplinaryCases(tenantId: string, params: { employeeId?: string; isClosed?: boolean; actionType?: string }) {
    const where: any = { tenantId };
    if (params.employeeId) where.employeeId = params.employeeId;
    if (params.isClosed !== undefined) where.isClosed = params.isClosed;
    if (params.actionType) where.actionType = params.actionType as any;

    const rows = await this.prisma.client.hrDisciplinaryCase.findMany({
      where,
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeNo: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((r: any) => this.toCaseDto(r));
  }

  async createDisciplinaryCase(tenantId: string, input: {
    employeeId: string;
    incidentDate: string;
    incidentDesc: string;
    actionType: string;
    notes?: string;
  }, user: JwtPayload) {
    // Benzersiz case no oluştur
    const year = new Date().getFullYear();
    const count = await this.prisma.client.hrDisciplinaryCase.count({
      where: { tenantId, createdAt: { gte: new Date(`${year}-01-01`) } },
    });
    const caseNo = `DISC-${year}-${String(count + 1).padStart(3, '0')}`;

    const { incidentDate: incDate, ...rest } = input;
    return this.prisma.client.hrDisciplinaryCase.create({
      data: { tenantId, caseNo, incidentDate: new Date(incDate as string), createdBy: user.sub, ...rest } as any,
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeNo: true } } },
    });
  }

  async closeDisciplinaryCase(tenantId: string, id: string, input: { actionType: string; actionDate?: string; actionNotes?: string }, user: JwtPayload) {
    return this.prisma.client.hrDisciplinaryCase.update({
      where: { id },
      data: {
        isClosed: true,
        actionType: input.actionType as any,
        actionDate: input.actionDate ? new Date(input.actionDate) : new Date(),
        actionNotes: input.actionNotes,
        closedBy: user.sub,
        closedAt: new Date(),
      },
    });
  }

  // ================== CAREER ==================

  async listCareerRecords(tenantId: string, params: { employeeId?: string; recordType?: string }) {
    const where: any = { tenantId };
    if (params.employeeId) where.employeeId = params.employeeId;
    if (params.recordType) where.recordType = params.recordType;

    const rows = await this.prisma.client.hrCareerRecord.findMany({
      where,
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeNo: true } } },
      orderBy: { effectiveDate: 'desc' },
    });

    return rows.map((r: any) => ({
      id: r.id, tenantId: r.tenantId,
      employeeId: r.employeeId,
      employee: r.employee ? { id: r.employee.id, fullName: `${r.employee.firstName} ${r.employee.lastName}`, employeeNo: r.employee.employeeNo } : undefined,
      recordType: r.recordType,
      effectiveDate: r.effectiveDate.toISOString(),
      oldValue: r.oldValue, newValue: r.newValue,
      notes: r.notes, approvedBy: r.approvedBy,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async createCareerRecord(tenantId: string, input: { employeeId: string; recordType: string; effectiveDate: string; oldValue?: string; newValue?: string; notes?: string }, user: JwtPayload) {
    return this.prisma.client.hrCareerRecord.create({
      data: { tenantId, ...input, effectiveDate: new Date(input.effectiveDate) },
    });
  }

  // ================== TRAINING ==================

  async listTrainings(tenantId: string, params?: { status?: string; startDate?: string }) {
    const where: any = { tenantId };
    if (params?.status) where.status = params.status;
    if (params?.startDate) where.startDate = { gte: new Date(params.startDate) };

    return this.prisma.client.hrTraining.findMany({
      where,
      include: { _count: { select: { participants: true } } },
      orderBy: { startDate: 'desc' },
    });
  }

  async createTraining(tenantId: string, input: any, user: JwtPayload) {
    return this.prisma.client.hrTraining.create({
      data: { tenantId, ...input, createdBy: user.sub },
    });
  }

  async addTrainingParticipant(trainingId: string, employeeId: string) {
    return this.prisma.client.hrTrainingParticipant.upsert({
      where: { trainingId_employeeId: { trainingId, employeeId } },
      create: { trainingId, employeeId },
      update: {},
    });
  }

  async updateParticipantScore(id: string, input: { score?: number; status?: string; certificateUrl?: string }) {
    return this.prisma.client.hrTrainingParticipant.update({
      where: { id },
      data: input,
    });
  }

  // ================== PERFORMANCE ==================

  async listPerformanceReviews(tenantId: string, params: { employeeId?: string; period?: string; status?: string }) {
    const where: any = { tenantId };
    if (params.employeeId) where.employeeId = params.employeeId;
    if (params.period) where.period = params.period;
    if (params.status) where.status = params.status;

    const rows = await this.prisma.client.hrPerformanceReview.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeNo: true } },
        reviewer: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((r: any) => ({
      id: r.id, tenantId: r.tenantId,
      employeeId: r.employeeId,
      employee: r.employee ? { id: r.employee.id, fullName: `${r.employee.firstName} ${r.employee.lastName}`, employeeNo: r.employee.employeeNo } : undefined,
      period: r.period,
      reviewerId: r.reviewerId,
      reviewer: r.reviewer ? { id: r.reviewer.id, fullName: r.reviewer.fullName } : undefined,
      status: r.status,
      overallScore: r.overallScore ? Number(r.overallScore) : null,
      taskCompletion: r.taskCompletion ? Number(r.taskCompletion) : null,
      teamwork: r.teamwork ? Number(r.teamwork) : null,
      communication: r.communication ? Number(r.communication) : null,
      problemSolving: r.problemSolving ? Number(r.problemSolving) : null,
      leadership: r.leadership ? Number(r.leadership) : null,
      strengths: r.strengths, developmentAreas: r.developmentAreas,
      goals: r.goals, reviewerNotes: r.reviewerNotes,
      employeeComment: r.employeeComment,
      completedAt: r.completedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async upsertPerformanceReview(tenantId: string, input: any, user: JwtPayload) {
    const existing = await this.prisma.client.hrPerformanceReview.findFirst({
      where: { tenantId, employeeId: input.employeeId, period: input.period },
    });

    if (existing) {
      return this.prisma.client.hrPerformanceReview.update({
        where: { id: existing.id },
        data: input,
      });
    }
    return this.prisma.client.hrPerformanceReview.create({
      data: { tenantId, ...input, reviewerId: user.sub },
    });
  }

  async completePerformanceReview(tenantId: string, id: string, input: { reviewerNotes?: string; employeeComment?: string }, user: JwtPayload) {
    return this.prisma.client.hrPerformanceReview.update({
      where: { id },
      data: { ...input, status: 'COMPLETED', completedAt: new Date() },
    });
  }

  // ================== HELPERS ==================

  private toAbsenceDto(r: any): any {
    return {
      id: r.id, tenantId: r.tenantId,
      employeeId: r.employeeId,
      employee: r.employee ? { id: r.employee.id, fullName: `${r.employee.firstName} ${r.employee.lastName}`, employeeNo: r.employee.employeeNo } : undefined,
      absenceType: r.absenceType,
      startDate: r.startDate.toISOString(),
      endDate: r.endDate.toISOString(),
      totalDays: Number(r.totalDays),
      reason: r.reason, isJustified: r.isJustified,
      deductionAmount: Number(r.deductionAmount),
      periodId: r.periodId,
      createdBy: r.createdBy,
      createdAt: r.createdAt.toISOString(),
    };
  }

  private toCaseDto(r: any): any {
    return {
      id: r.id, tenantId: r.tenantId,
      employeeId: r.employeeId,
      employee: r.employee ? { id: r.employee.id, fullName: `${r.employee.firstName} ${r.employee.lastName}`, employeeNo: r.employee.employeeNo } : undefined,
      caseNo: r.caseNo,
      incidentDate: r.incidentDate.toISOString(),
      incidentDesc: r.incidentDesc,
      actionType: r.actionType,
      actionDate: r.actionDate?.toISOString() ?? null,
      actionNotes: r.actionNotes,
      isClosed: r.isClosed,
      closedBy: r.closedBy,
      closedAt: r.closedAt?.toISOString() ?? null,
      createdBy: r.createdBy,
      createdAt: r.createdAt.toISOString(),
    };
  }
}