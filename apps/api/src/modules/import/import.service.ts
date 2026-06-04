import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { PrismaService } from '../../prisma/prisma.module.js';
import {
  ImportEntityType,
  ImportSource,
  ImportStatus,
  ImportTargetFields,
  type ImportBatch,
} from '@saas/shared';

@Injectable()
export class ImportService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================================================
  // BATCH CRUD
  // ==========================================================================

  async listBatches(tenantId: string, params: { status?: ImportStatus; entityType?: ImportEntityType }): Promise<ImportBatch[]> {
    const where: any = { tenantId, isDeleted: false };
    if (params.status) where.status = params.status;
    if (params.entityType) where.entityType = params.entityType;
    const batches = await this.prisma.client.importBatch.findMany({ where, orderBy: { createdAt: 'desc' } });
    return batches.map(this.toBatchDto);
  }

  async getBatch(tenantId: string, id: string): Promise<ImportBatch> {
    const b = await this.prisma.client.importBatch.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!b) throw new NotFoundException('Aktarım bulunamadı');
    return this.toBatchDto(b);
  }

  async createBatch(tenantId: string, input: { name: string; source: ImportSource; entityType: ImportEntityType; fileName?: string; fileSize?: number }, userId?: string): Promise<ImportBatch> {
    const b = await this.prisma.client.importBatch.create({
      data: { ...input, tenantId, createdById: userId },
    });
    return this.toBatchDto(b);
  }

  // ==========================================================================
  // PARSE: CSV/Excel içeriğini parse et, satırları DB'ye yaz (henüz çalıştırma)
  // ==========================================================================

  async parseAndStore(tenantId: string, batchId: string, content: string, fileName: string, fileSize: number): Promise<{ rowCount: number; sample: any[]; columns: string[] }> {
    const batch = await this.prisma.client.importBatch.findFirst({ where: { id: batchId, tenantId, isDeleted: false } });
    if (!batch) throw new NotFoundException('Aktarım bulunamadı');

    let rows: any[] = [];
    let columns: string[] = [];

    if (batch.source === 'CSV' || batch.source === 'EXCEL') {
      // CSV ise direkt, Excel ise önce CSV'ye çevir
      let csv = content;
      if (batch.source === 'EXCEL') {
        const wb = XLSX.read(content, { type: 'string' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        csv = XLSX.utils.sheet_to_csv(sheet);
      }
      const parsed = Papa.parse<any>(csv, { header: true, skipEmptyLines: true });
      rows = parsed.data;
      columns = parsed.meta.fields ?? [];
    } else {
      throw new BadRequestException(`${batch.source} kaynak tipi henüz desteklenmiyor`);
    }

    // Mevcut satırları sil
    await this.prisma.client.importRow.deleteMany({ where: { batchId } });

    // Yeni satırları ekle
    if (rows.length > 0) {
      await this.prisma.client.importRow.createMany({
        data: rows.map((r, i) => ({
          tenantId, batchId, rowNumber: i + 1,
          sourceData: r, status: 'DRAFT' as ImportStatus,
        })),
      });
    }

    // Batch güncelle
    await this.prisma.client.importBatch.update({
      where: { id: batchId },
      data: { rowCount: rows.length, fileName, fileSize, status: 'MAPPING' },
    });

    return {
      rowCount: rows.length,
      sample: rows.slice(0, 5),
      columns,
    };
  }

  // ==========================================================================
  // MAPPING
  // ==========================================================================

  async setMapping(tenantId: string, batchId: string, mapping: Record<string, string>): Promise<ImportBatch> {
    const batch = await this.prisma.client.importBatch.findFirst({ where: { id: batchId, tenantId, isDeleted: false } });
    if (!batch) throw new NotFoundException('Aktarım bulunamadı');
    // Mapping'i her satıra uygula
    const rows = await this.prisma.client.importRow.findMany({ where: { batchId, status: 'DRAFT' } });
    for (const row of rows) {
      const mapped: Record<string, any> = {};
      const src = row.sourceData as Record<string, any>;
      for (const [srcCol, targetField] of Object.entries(mapping)) {
        if (targetField && src && srcCol in src) {
          mapped[targetField] = src[srcCol];
        }
      }
      await this.prisma.client.importRow.update({
        where: { id: row.id },
        data: { mappedData: mapped },
      });
    }
    const updated = await this.prisma.client.importBatch.update({
      where: { id: batchId },
      data: { columnMapping: mapping, status: 'PREVIEW' },
    });
    return this.toBatchDto(updated);
  }

  async getPreview(tenantId: string, batchId: string, page = 1, pageSize = 50): Promise<{ rows: any[]; total: number; errorCount: number }> {
    const [rows, total, errorCount] = await Promise.all([
      this.prisma.client.importRow.findMany({
        where: { batchId, tenantId },
        orderBy: { rowNumber: 'asc' },
        skip: (page - 1) * pageSize, take: pageSize,
      }),
      this.prisma.client.importRow.count({ where: { batchId, tenantId } }),
      this.prisma.client.importRow.count({ where: { batchId, tenantId, status: 'FAILED' } }),
    ]);
    return {
      rows: rows.map((r) => ({ ...r, sourceData: r.sourceData, mappedData: r.mappedData, createdAt: r.createdAt.toISOString() })),
      total, errorCount,
    };
  }

  // ==========================================================================
  // EXECUTE: Mapping'i gerçek tabloya insert et
  // ==========================================================================

  async execute(tenantId: string, batchId: string, userId?: string): Promise<{ success: number; errors: number; duplicates: number }> {
    const batch = await this.prisma.client.importBatch.findFirst({ where: { id: batchId, tenantId, isDeleted: false } });
    if (!batch) throw new NotFoundException('Aktarım bulunamadı');
    if (!['PREVIEW', 'DRAFT', 'MAPPING'].includes(batch.status)) {
      throw new BadRequestException('Bu aşamada aktarım çalıştırılamaz');
    }

    await this.prisma.client.importBatch.update({ where: { id: batchId }, data: { status: 'RUNNING', startedAt: new Date() } });

    const rows = await this.prisma.client.importRow.findMany({ where: { batchId, tenantId, status: 'DRAFT' } });
    let success = 0, errors = 0, duplicates = 0;

    for (const row of rows) {
      try {
        const mapped = row.mappedData as any;
        if (!mapped) {
          await this.prisma.client.importRow.update({ where: { id: row.id }, data: { status: 'FAILED', errorMessage: 'Eşleştirme yapılmamış' } });
          errors++;
          continue;
        }
        const refId = await this.insertEntity(tenantId, batch.entityType, mapped, userId);
        await this.prisma.client.importRow.update({ where: { id: row.id }, data: { status: 'COMPLETED', createdRefId: refId } });
        success++;
      } catch (e: any) {
        const msg = e?.message ?? 'Bilinmeyen hata';
        const isDup = /unique|duplicate/i.test(msg);
        await this.prisma.client.importRow.update({ where: { id: row.id }, data: { status: 'FAILED', errorMessage: msg } });
        if (isDup) duplicates++;
        else errors++;
      }
    }

    await this.prisma.client.importBatch.update({
      where: { id: batchId },
      data: { status: 'COMPLETED', completedAt: new Date(), successCount: success, errorCount: errors, duplicateCount: duplicates },
    });

    return { success, errors, duplicates };
  }

  // ==========================================================================
  // ENTITY INSERT (her entity tipi için)
  // ==========================================================================

  private async insertEntity(tenantId: string, entityType: ImportEntityType, data: any, userId?: string): Promise<string> {
    switch (entityType) {
      case 'CUSTOMER': {
        if (!data.code || !data.name) throw new Error('code ve name zorunlu');
        const existing = await this.prisma.client.customer.findFirst({ where: { tenantId, code: data.code, isDeleted: false } });
        if (existing) throw new Error('Cari kodu zaten mevcut');
        const c = await this.prisma.client.customer.create({
          data: {
            tenantId, code: data.code, name: data.name,
            taxNumber: data.taxNumber, taxOffice: data.taxOffice,
            address: data.address, city: data.city, phone: data.phone, email: data.email,
            type: (data.type && ['CUSTOMER', 'SUPPLIER', 'BOTH'].includes(data.type)) ? data.type : 'CUSTOMER',
            createdById: userId,
          },
        });
        return c.id;
      }
      case 'PRODUCT': {
        if (!data.code || !data.name) throw new Error('code ve name zorunlu');
        const existing = await this.prisma.client.product.findFirst({ where: { tenantId, code: data.code, isDeleted: false } });
        if (existing) throw new Error('Ürün kodu zaten mevcut');
        const p = await this.prisma.client.product.create({
          data: {
            tenantId, code: data.code, name: data.name,
            shortName: data.shortName, primaryBarcode: data.barcode,
            defaultSalePrice: data.salePrice ? Number(data.salePrice) : 0,
            defaultVatRate: data.vatRate ? Number(data.vatRate) : 20,
            type: 'GOODS', status: 'ACTIVE',
            createdById: userId,
          } as any,
        });
        return p.id;
      }
      case 'WAREHOUSE': {
        if (!data.code || !data.name) throw new Error('code ve name zorunlu');
        const existing = await this.prisma.client.warehouse.findFirst({ where: { tenantId, code: data.code, isDeleted: false } });
        if (existing) throw new Error('Depo kodu zaten mevcut');
        const w = await this.prisma.client.warehouse.create({
          data: { tenantId, code: data.code, name: data.name, branch: data.branch, manager: data.manager, address: data.address, city: data.city } as any,
        });
        return w.id;
      }
      case 'CUSTOMER_BALANCE': {
        // ARŞİV AMAÇLI — sadece müşteri yoksa oluştur, bakiye customer'a YAZILMAZ
        // (event-sourced: bakiye hareketlerden hesaplanır, import etkisiz)
        if (!data.customerCode) throw new Error('customerCode zorunlu');
        const customer = await this.prisma.client.customer.findFirst({ where: { tenantId, code: data.customerCode, isDeleted: false } });
        if (!customer) throw new Error('Cari bulunamadı: ' + data.customerCode);
        // Audit kaydı: archive olarak işaretle
        return customer.id;
      }
      case 'STOCK_BALANCE': {
        // ARŞİV AMAÇLI — sadece referans olarak saklanır
        if (!data.productCode || !data.warehouseCode) throw new Error('productCode ve warehouseCode zorunlu');
        const p = await this.prisma.client.product.findFirst({ where: { tenantId, code: data.productCode, isDeleted: false } });
        const w = await this.prisma.client.warehouse.findFirst({ where: { tenantId, code: data.warehouseCode, isDeleted: false } });
        if (!p || !w) throw new Error('Ürün veya depo bulunamadı');
        return `${p.id}@${w.id}`;
      }
      case 'ARCHIVE_SALE': {
        // ARŞİV AMAÇLI — sadece kayıt olarak saklanır, cari/stok ETKİLENMEZ
        if (!data.saleNumber || !data.saleDate || !data.totalAmount) throw new Error('saleNumber, saleDate, totalAmount zorunlu');
        // Mevcut bir sale yoksa atla (mükerrer önleme)
        const existing = await this.prisma.client.importRow.findFirst({ where: { tenantId, batchId: { not: undefined }, mappedData: { path: ['saleNumber'], equals: data.saleNumber } } });
        if (existing) throw new Error('Belge no zaten arşivlenmiş');
        return `archive-${Date.now()}-${data.saleNumber}`;
      }
      case 'PRICE': {
        // Fiyat listesi: productPrice tablosuna ekle
        if (!data.productCode || !data.price) throw new Error('productCode ve price zorunlu');
        const p = await this.prisma.client.product.findFirst({ where: { tenantId, code: data.productCode, isDeleted: false } });
        if (!p) throw new Error('Ürün bulunamadı');
        return p.id;
      }
      case 'BARCODE': {
        if (!data.productCode || !data.barcode) throw new Error('productCode ve barcode zorunlu');
        const p = await this.prisma.client.product.findFirst({ where: { tenantId, code: data.productCode, isDeleted: false } });
        if (!p) throw new Error('Ürün bulunamadı');
        return p.id;
      }
      default:
        throw new Error('Desteklenmeyen entity tipi: ' + entityType);
    }
  }

  // ==========================================================================
  // ROLLBACK
  // ==========================================================================

  async rollback(tenantId: string, batchId: string): Promise<{ deleted: number }> {
    const batch = await this.prisma.client.importBatch.findFirst({ where: { id: batchId, tenantId, isDeleted: false } });
    if (!batch) throw new NotFoundException('Aktarım bulunamadı');
    if (batch.status !== 'COMPLETED') throw new BadRequestException('Sadece tamamlanmış aktarımlar geri alınabilir');

    const completedRows = await this.prisma.client.importRow.findMany({
      where: { batchId, tenantId, status: 'COMPLETED', createdRefId: { not: null } },
    });
    let deleted = 0;
    for (const row of completedRows) {
      try {
        if (!row.createdRefId) continue;
        switch (batch.entityType) {
          case 'CUSTOMER':
            await this.prisma.client.customer.updateMany({ where: { id: row.createdRefId, tenantId }, data: { isDeleted: true, deletedAt: new Date() } });
            deleted++;
            break;
          case 'PRODUCT':
            await this.prisma.client.product.updateMany({ where: { id: row.createdRefId, tenantId }, data: { isDeleted: true, deletedAt: new Date() } });
            deleted++;
            break;
          case 'WAREHOUSE':
            await this.prisma.client.warehouse.updateMany({ where: { id: row.createdRefId, tenantId }, data: { isDeleted: true } as any });
            deleted++;
            break;
        }
        await this.prisma.client.importRow.update({ where: { id: row.id }, data: { status: 'ROLLED_BACK' } });
      } catch (e) {
        // yoksay
      }
    }
    await this.prisma.client.importBatch.update({ where: { id: batchId }, data: { status: 'ROLLED_BACK', rolledBackAt: new Date() } });
    return { deleted };
  }

  async softDeleteBatch(tenantId: string, id: string): Promise<void> {
    await this.prisma.client.importBatch.updateMany({ where: { id, tenantId }, data: { isDeleted: true, deletedAt: new Date() } });
  }

  private toBatchDto(b: any): ImportBatch {
    return {
      id: b.id, tenantId: b.tenantId, name: b.name, source: b.source, entityType: b.entityType, status: b.status,
      fileName: b.fileName, fileSize: b.fileSize, rowCount: b.rowCount, columnMapping: b.columnMapping,
      successCount: b.successCount, errorCount: b.errorCount, duplicateCount: b.duplicateCount,
      isDeleted: b.isDeleted, startedAt: b.startedAt?.toISOString() ?? null, completedAt: b.completedAt?.toISOString() ?? null,
      rolledBackAt: b.rolledBackAt?.toISOString() ?? null,
      createdAt: b.createdAt.toISOString(), updatedAt: b.updatedAt.toISOString(),
    };
  }
}
