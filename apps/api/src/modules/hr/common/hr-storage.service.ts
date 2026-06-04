import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

/**
 * HR dosya storage servisi.
 * Geliştirmede lokal dosya sistemi, üretimde R2/S3.
 * Storage key: hr/{tenantId}/{employeeId}/{documentType}/{filename}
 */
@Injectable()
export class HrStorageService {
  private readonly logger = new Logger(HrStorageService.name);
  private readonly basePath: string;

  constructor(private readonly config: ConfigService) {
    this.basePath = this.config.get<string>('r2.local.path') ?? './storage';
    this.ensureDir(this.basePath);
  }

  /**
   * Dosyayı yaz.
   */
  async write(
    tenantId: string,
    employeeId: string,
    documentType: string,
    fileName: string,
    buffer: Buffer,
  ): Promise<string> {
    const key = this.buildKey(tenantId, employeeId, documentType, fileName);
    const fullPath = path.join(this.basePath, key);
    const dir = path.dirname(fullPath);
    this.ensureDir(dir);
    await fs.promises.writeFile(fullPath, buffer);
    this.logger.log(`Dosya yazıldı: ${key} (${buffer.length} bytes)`);
    return key;
  }

  /**
   * Dosyayı oku.
   */
  async read(key: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, key);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Dosya bulunamadı: ${key}`);
    }
    return fs.promises.readFile(fullPath);
  }

  /**
   * Dosyayı sil.
   */
  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.basePath, key);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      this.logger.log(`Dosya silindi: ${key}`);
    }
  }

  /**
   * Dosya var mı?
   */
  exists(key: string): boolean {
    const fullPath = path.join(this.basePath, key);
    return fs.existsSync(fullPath);
  }

  private buildKey(tenantId: string, employeeId: string, documentType: string, fileName: string): string {
    const safeFile = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return path.join('hr', tenantId, employeeId, documentType, safeFile);
  }

  private ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
