import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.module.js';
import { maskEmail, maskIban, maskIdentityNumber, maskPhone } from './common/data-masking';
import type {
  CreateHrEmployeeDto,
  FilterHrEmployeeDto,
  HrEmployee,
  PaginatedResponse,
  UpdateHrEmployeeDto,
  JwtPayload,
} from '@saas/shared';

@Injectable()
export class HrEmployeesService {
  private readonly logger = new Logger(HrEmployeesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Personel listesi.
   * includeSensitive=false (default) → TC, IBAN maskeli.
   */
  async list(
    tenantId: string,
    params: FilterHrEmployeeDto,
    user: JwtPayload,
  ): Promise<PaginatedResponse<HrEmployee>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const includeSensitive = this.canSeeSensitive(user);

    const where: Prisma.HrEmployeeWhereInput = {
      tenantId,
      isDeleted: false,
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            OR: [
              { firstName: { contains: params.search, mode: 'insensitive' } },
              { lastName: { contains: params.search, mode: 'insensitive' } },
              { employeeNo: { contains: params.search, mode: 'insensitive' } },
              { phone: { contains: params.search } },
              { identityNumber: { contains: params.search } },
            ],
          }
        : {}),
    };

    // Departman/şube filtresi employment tablosundan
    if (params.department || params.branch || params.workingType) {
      where.employment = {
        ...(params.department ? { department: params.department } : {}),
        ...(params.branch ? { branch: params.branch } : {}),
        ...(params.workingType ? { workingType: params.workingType } : {}),
      };
    }

    const [rows, total] = await Promise.all([
      this.prisma.client.hrEmployee.findMany({
        where,
        include: { employment: true, _count: { select: { documents: { where: { isDeleted: false } } } } },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.client.hrEmployee.count({ where }),
    ]);

    return {
      data: rows.map((e: any) => this.toDto(e, includeSensitive)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page * pageSize < total,
        hasPrev: page > 1,
      },
    };
  }

  async get(tenantId: string, id: string, user: JwtPayload): Promise<HrEmployee> {
    const employee = await this.prisma.client.hrEmployee.findFirst({
      where: { id, tenantId, isDeleted: false },
      include: { employment: true, _count: { select: { documents: { where: { isDeleted: false } } } } },
    });
    if (!employee) throw new NotFoundException('Personel bulunamadı');
    return this.toDto(employee as any, this.canSeeSensitive(user));
  }

  /**
   * Sensitive data full açma (TC/IBAN).
   * Bu metod SADECE hr.sensitive_data.view yetkisi olanlar için kullanılır.
   */
  async getSensitive(tenantId: string, id: string, user: JwtPayload): Promise<{
    identityNumber: string | null;
    iban: string | null;
  }> {
    if (!this.canSeeSensitive(user)) {
      throw new BadRequestException('Hassas veri görüntüleme yetkiniz yok');
    }
    const employee = await this.prisma.client.hrEmployee.findFirst({
      where: { id, tenantId, isDeleted: false },
      select: { identityNumber: true, iban: true },
    });
    if (!employee) throw new NotFoundException('Personel bulunamadı');
    return { identityNumber: employee.identityNumber, iban: employee.iban };
  }

  async create(tenantId: string, input: CreateHrEmployeeDto, user: JwtPayload): Promise<HrEmployee> {
    // TC kontrol (eğer verilmişse)
    if (input.identityNumber) {
      const existing = await this.prisma.client.hrEmployee.findFirst({
        where: { tenantId, identityNumber: input.identityNumber, isDeleted: false },
      });
      if (existing) {
        throw new ConflictException('Bu TC kimlik no ile kayıtlı personel var');
      }
    }

    // employeeNo otomatik üret (yıl + 4 haneli sayaç)
    let employeeNo = input.employeeNo;
    if (!employeeNo) {
      const year = new Date().getFullYear();
      const count = await this.prisma.client.hrEmployee.count({
        where: { tenantId, employeeNo: { startsWith: `${year}-` } },
      });
      employeeNo = `${year}-${String(count + 1).padStart(4, '0')}`;
    } else {
      // Manuel employeeNo unique kontrol
      const existing = await this.prisma.client.hrEmployee.findUnique({
        where: { tenantId_employeeNo: { tenantId, employeeNo } },
      });
      if (existing) throw new ConflictException('Bu personel no kullanımda');
    }

    const created = await this.prisma.client.hrEmployee.create({
      data: {
        tenantId,
        employeeNo,
        firstName: input.firstName,
        lastName: input.lastName,
        identityNumber: input.identityNumber,
        birthDate: input.birthDate ? new Date(input.birthDate) : null,
        gender: input.gender,
        maritalStatus: input.maritalStatus,
        bloodType: input.bloodType,
        phone: input.phone,
        email: input.email,
        address: input.address,
        emergencyContact: input.emergencyContact,
        emergencyPhone: input.emergencyPhone,
        iban: input.iban,
        hireDate: input.hireDate ? new Date(input.hireDate) : null,
        notes: input.notes,
        createdBy: user.sub,
        employment: input.employment
          ? {
              create: {
                tenantId,
                department: input.employment.department,
                branch: input.employment.branch,
                position: input.employment.position,
                workingType: input.employment.workingType,
                contractType: input.employment.contractType,
                contractStartDate: input.employment.contractStartDate
                  ? new Date(input.employment.contractStartDate)
                  : null,
                contractEndDate: input.employment.contractEndDate
                  ? new Date(input.employment.contractEndDate)
                  : null,
                probationMonths: input.employment.probationMonths ?? 0,
                probationEndDate: input.employment.probationEndDate
                  ? new Date(input.employment.probationEndDate)
                  : null,
                sgkRegistrationNo: input.employment.sgkRegistrationNo,
                sgkEmployerNo: input.employment.sgkEmployerNo,
                sgkWorkplaceCode: input.employment.sgkWorkplaceCode,
                jobDescription: input.employment.jobDescription,
                weeklyHours: input.employment.weeklyHours,
                workLocation: input.employment.workLocation,
                createdBy: user.sub,
              },
            }
          : undefined,
      },
      include: { employment: true },
    });

    await this.auditLog(tenantId, user.sub, 'hr.employee.create', 'HrEmployee', created.id, {
      employeeNo: created.employeeNo,
      fullName: `${created.firstName} ${created.lastName}`,
    });

    return this.toDto(created as any, this.canSeeSensitive(user));
  }

  async update(tenantId: string, id: string, input: UpdateHrEmployeeDto, user: JwtPayload): Promise<HrEmployee> {
    const existing = await this.prisma.client.hrEmployee.findFirst({
      where: { id, tenantId, isDeleted: false },
      include: { employment: true },
    });
    if (!existing) throw new NotFoundException('Personel bulunamadı');

    const updated = await this.prisma.client.hrEmployee.update({
      where: { id },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        identityNumber: input.identityNumber,
        birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
        gender: input.gender,
        maritalStatus: input.maritalStatus,
        bloodType: input.bloodType,
        phone: input.phone,
        email: input.email,
        address: input.address,
        emergencyContact: input.emergencyContact,
        emergencyPhone: input.emergencyPhone,
        iban: input.iban,
        hireDate: input.hireDate ? new Date(input.hireDate) : undefined,
        terminationDate: input.terminationDate ? new Date(input.terminationDate) : undefined,
        terminationReason: input.terminationReason,
        notes: input.notes,
        updatedBy: user.sub,
      },
      include: { employment: true },
    });

    // Employment bilgileri ayrı update
    if (input.employment && existing.employment) {
      await this.prisma.client.hrEmployeeEmploymentInfo.update({
        where: { employeeId: id },
        data: {
          department: input.employment.department,
          branch: input.employment.branch,
          position: input.employment.position,
          workingType: input.employment.workingType,
          contractType: input.employment.contractType,
          contractStartDate: input.employment.contractStartDate
            ? new Date(input.employment.contractStartDate)
            : null,
          contractEndDate: input.employment.contractEndDate
            ? new Date(input.employment.contractEndDate)
            : null,
          probationMonths: input.employment.probationMonths,
          sgkRegistrationNo: input.employment.sgkRegistrationNo,
          sgkEmployerNo: input.employment.sgkEmployerNo,
          sgkWorkplaceCode: input.employment.sgkWorkplaceCode,
          jobDescription: input.employment.jobDescription,
          weeklyHours: input.employment.weeklyHours,
          workLocation: input.employment.workLocation,
          updatedBy: user.sub,
        },
      });
    }

    await this.auditLog(tenantId, user.sub, 'hr.employee.update', 'HrEmployee', id, {});

    return this.get(tenantId, id, user);
  }

  /**
   * Soft delete (arşivleme).
   */
  async archive(tenantId: string, id: string, user: JwtPayload): Promise<{ ok: true }> {
    const existing = await this.prisma.client.hrEmployee.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
    if (!existing) throw new NotFoundException('Personel bulunamadı');

    await this.prisma.client.hrEmployee.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: user.sub,
        status: 'ARCHIVED',
      },
    });

    await this.auditLog(tenantId, user.sub, 'hr.employee.archive', 'HrEmployee', id, {});
    return { ok: true };
  }

  /**
   * İstifa/çıkış (status değişimi).
   */
  async terminate(
    tenantId: string,
    id: string,
    data: { terminationDate: string; reason: string },
    user: JwtPayload,
  ): Promise<HrEmployee> {
    const existing = await this.prisma.client.hrEmployee.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
    if (!existing) throw new NotFoundException('Personel bulunamadı');

    await this.prisma.client.hrEmployee.update({
      where: { id },
      data: {
        terminationDate: new Date(data.terminationDate),
        terminationReason: data.reason,
        status: 'TERMINATED',
        updatedBy: user.sub,
      },
    });

    await this.auditLog(tenantId, user.sub, 'hr.employee.terminate', 'HrEmployee', id, data);
    return this.get(tenantId, id, user);
  }

  /**
   * Departman/şube distinct listesi (UI dropdown için).
   */
  async getDepartments(tenantId: string): Promise<string[]> {
    const rows = await this.prisma.client.hrEmployeeEmploymentInfo.findMany({
      where: { tenantId, department: { not: null } },
      select: { department: true },
      distinct: ['department'],
    });
    return rows.map((r: any) => r.department!).filter(Boolean).sort();
  }

  async getBranches(tenantId: string): Promise<string[]> {
    const rows = await this.prisma.client.hrEmployeeEmploymentInfo.findMany({
      where: { tenantId, branch: { not: null } },
      select: { branch: true },
      distinct: ['branch'],
    });
    return rows.map((r: any) => r.branch!).filter(Boolean).sort();
  }

  // ---- helpers ----

  private canSeeSensitive(user: JwtPayload): boolean {
    if (user.tid === 'SYSTEM' || user.role === 'super_admin') return true;
    return user.perms?.includes('ik:sensitive_data:view') ?? false;
  }

  private toDto(
    e: Prisma.HrEmployeeGetPayload<{
      include: { employment: true; _count: { select: { documents: { where: { isDeleted: false } } } } };
    }>,
    includeSensitive: boolean,
  ): HrEmployee {
    return {
      id: e.id,
      employeeNo: e.employeeNo,
      firstName: e.firstName,
      lastName: e.lastName,
      fullName: `${e.firstName} ${e.lastName}`,
      identityNumber: (includeSensitive ? e.identityNumber : maskIdentityNumber(e.identityNumber)) ?? undefined,
      identityNumberVisible: includeSensitive ? e.identityNumber ?? undefined : undefined,
      birthDate: e.birthDate?.toISOString() ?? null,
      gender: e.gender,
      maritalStatus: e.maritalStatus,
      bloodType: e.bloodType,
      phone: maskPhone(e.phone) ?? undefined,
      email: maskEmail(e.email) ?? undefined,
      address: e.address,
      emergencyContact: e.emergencyContact,
      emergencyPhone: maskPhone(e.emergencyPhone) ?? undefined,
      iban: includeSensitive ? e.iban ?? undefined : maskIban(e.iban) ?? undefined,
      ibanVisible: includeSensitive ? e.iban ?? undefined : undefined,
      photoUrl: e.photoUrl,
      status: e.status,
      hireDate: e.hireDate?.toISOString() ?? null,
      terminationDate: e.terminationDate?.toISOString() ?? null,
      terminationReason: e.terminationReason,
      notes: e.notes,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      employment: e.employment
        ? {
            id: e.employment.id,
            employeeId: e.employment.employeeId,
            department: e.employment.department,
            branch: e.employment.branch,
            position: e.employment.position,
            workingType: e.employment.workingType,
            contractType: e.employment.contractType,
            contractStartDate: e.employment.contractStartDate?.toISOString() ?? null,
            contractEndDate: e.employment.contractEndDate?.toISOString() ?? null,
            probationMonths: e.employment.probationMonths,
            probationEndDate: e.employment.probationEndDate?.toISOString() ?? null,
            sgkRegistrationNo: e.employment.sgkRegistrationNo,
            sgkEmployerNo: e.employment.sgkEmployerNo,
            sgkWorkplaceCode: e.employment.sgkWorkplaceCode,
            jobDescription: e.employment.jobDescription,
            weeklyHours: e.employment.weeklyHours ? Number(e.employment.weeklyHours) : null,
            workLocation: e.employment.workLocation,
            isActive: e.employment.isActive,
          }
        : null,
      documentCount: (e as { _count?: { documents: number } })._count?.documents ?? 0,
    };
  }

  private async auditLog(
    tenantId: string,
    userId: string,
    event: string,
    resource: string,
    resourceId: string,
    metadata: Record<string, unknown>,
  ) {
    try {
      // SecurityLog modeli varsa (audit modülü)
      await (this.prisma.client as any).securityLog?.create?.({
        data: {
          tenantId,
          userId,
          event,
          resource,
          resourceId,
          metadata,
          createdAt: new Date(),
        },
      });
    } catch (err) {
      this.logger.warn(`Audit log yazılamadı: ${(err as Error).message}`);
    }
  }
}
