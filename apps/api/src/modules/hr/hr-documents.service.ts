import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module.js';
import { HrStorageService } from './common/hr-storage.service';
import type { HrEmployeeDocument, JwtPayload } from '@saas/shared';

@Injectable()
export class HrDocumentsService {
  private readonly logger = new Logger(HrDocumentsService.name);

  // Max dosya boyutu: 20 MB
  private readonly MAX_FILE_SIZE = 20 * 1024 * 1024;

  // İzin verilen mime tipleri
  private readonly ALLOWED_MIMES = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: HrStorageService,
  ) {}

  /**
   * Personelin evraklarını listele.
   */
  async list(tenantId: string, employeeId: string, user: JwtPayload): Promise<HrEmployeeDocument[]> {
    // Önce personel var mı kontrol
    const employee = await this.prisma.client.hrEmployee.findFirst({
      where: { id: employeeId, tenantId, isDeleted: false },
      select: { id: true },
    });
    if (!employee) throw new NotFoundException('Personel bulunamadı');

    const docs = await this.prisma.client.hrEmployeeDocument.findMany({
      where: { tenantId, employeeId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
    });

    return docs.map((d) => this.toDto(d));
  }

  /**
   * Evrak yükle.
   */
  async upload(
    tenantId: string,
    employeeId: string,
    file: any,
    input: {
      documentType: string;
      title: string;
      issueDate?: string;
      expiryDate?: string;
      description?: string;
    },
    user: JwtPayload,
  ): Promise<HrEmployeeDocument> {
    if (!file) throw new BadRequestException('Dosya zorunlu');
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(`Dosya boyutu 20MB'ı aşamaz (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
    }
    if (!this.ALLOWED_MIMES.has(file.mimetype)) {
      throw new BadRequestException(`Dosya tipi izin verilmiyor: ${file.mimetype}`);
    }

    // Personel kontrol
    const employee = await this.prisma.client.hrEmployee.findFirst({
      where: { id: employeeId, tenantId, isDeleted: false },
      select: { id: true },
    });
    if (!employee) throw new NotFoundException('Personel bulunamadı');

    // Storage'a yaz
    const key = await this.storage.write(
      tenantId,
      employeeId,
      input.documentType,
      file.originalname,
      file.buffer,
    );

    const created = await this.prisma.client.hrEmployeeDocument.create({
      data: {
        tenantId,
        employeeId,
        documentType: input.documentType as any,
        title: input.title,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        storageKey: key,
        status: 'PENDING',
        issueDate: input.issueDate ? new Date(input.issueDate) : null,
        expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
        description: input.description,
        uploadedBy: user.sub,
      },
    });

    await this.auditLog(tenantId, user.sub, 'hr.document.upload', 'HrEmployeeDocument', created.id, {
      employeeId,
      documentType: input.documentType,
      fileName: file.originalname,
    });

    return this.toDto(created);
  }

  /**
   * Evrak indir (storage'dan).
   * Her indirme loglanır.
   */
  async download(
    tenantId: string,
    documentId: string,
    user: JwtPayload,
  ): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    const doc = await this.prisma.client.hrEmployeeDocument.findFirst({
      where: { id: documentId, tenantId, isDeleted: false },
    });
    if (!doc) throw new NotFoundException('Evrak bulunamadı');

    const buffer = await this.storage.read(doc.storageKey);

    await this.auditLog(tenantId, user.sub, 'hr.document.download', 'HrEmployeeDocument', documentId, {
      employeeId: doc.employeeId,
      fileName: doc.fileName,
    });

    return { buffer, fileName: doc.fileName, mimeType: doc.mimeType };
  }

  /**
   * Evrakı onayla / reddet.
   */
  async updateStatus(
    tenantId: string,
    documentId: string,
    status: 'APPROVED' | 'REJECTED',
    user: JwtPayload,
  ): Promise<HrEmployeeDocument> {
    const doc = await this.prisma.client.hrEmployeeDocument.findFirst({
      where: { id: documentId, tenantId, isDeleted: false },
    });
    if (!doc) throw new NotFoundException('Evrak bulunamadı');

    const updated = await this.prisma.client.hrEmployeeDocument.update({
      where: { id: documentId },
      data: {
        status,
        approvedBy: user.sub,
        approvedAt: new Date(),
      },
    });

    await this.auditLog(tenantId, user.sub, `hr.document.${status.toLowerCase()}`, 'HrEmployeeDocument', documentId, {});
    return this.toDto(updated);
  }

  /**
   * Evrak sil (soft delete + storage'dan sil).
   */
  async delete(tenantId: string, documentId: string, user: JwtPayload): Promise<{ ok: true }> {
    const doc = await this.prisma.client.hrEmployeeDocument.findFirst({
      where: { id: documentId, tenantId, isDeleted: false },
    });
    if (!doc) throw new NotFoundException('Evrak bulunamadı');

    await this.prisma.client.hrEmployeeDocument.update({
      where: { id: documentId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: user.sub,
      },
    });

    // Storage'dan da sil
    try {
      await this.storage.delete(doc.storageKey);
    } catch (err) {
      this.logger.warn(`Storage silinemedi: ${(err as Error).message}`);
    }

    await this.auditLog(tenantId, user.sub, 'hr.document.delete', 'HrEmployeeDocument', documentId, {});
    return { ok: true };
  }

  // ---- helpers ----

  private toDto(d: any): HrEmployeeDocument {
    return {
      id: d.id,
      employeeId: d.employeeId,
      documentType: d.documentType,
      title: d.title,
      fileName: d.fileName,
      fileSize: d.fileSize,
      mimeType: d.mimeType,
      status: d.status,
      issueDate: d.issueDate?.toISOString() ?? null,
      expiryDate: d.expiryDate?.toISOString() ?? null,
      description: d.description,
      uploadedBy: d.uploadedBy,
      approvedBy: d.approvedBy,
      approvedAt: d.approvedAt?.toISOString() ?? null,
      createdAt: d.createdAt.toISOString(),
      // downloadUrl controller'da set edilir
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
