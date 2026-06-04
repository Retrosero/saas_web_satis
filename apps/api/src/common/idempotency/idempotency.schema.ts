import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';
import { Response, NextFunction } from 'express';
import * as crypto from 'crypto';

const TTL_HOURS = 24;

@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: any, res: Response, next: NextFunction) {
    // Sadece mutating endpoint'lerde (POST, PUT, DELETE) ve Idempotency-Key header varsa
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) return next();
    const key = req.headers['idempotency-key'] as string;
    if (!key) return next();
    if (key.length < 8 || key.length > 128) throw new BadRequestException('Idempotency-Key 8-128 karakter olmalı');

    const tenantId: string = req.user?.tenantId ?? 'public';
    const fingerprint = crypto.createHash('sha256').update(`${req.method}:${req.originalUrl}:${JSON.stringify(req.body ?? {})}`).digest('hex');

    // Daha önce aynı key ile işlem yapılmış mı?
    const existing = await this.prisma.client.idempotencyKey.findUnique({ where: { key: `${tenantId}:${key}` } });
    if (existing) {
      // Fingerprint eşleşmiyorsa çakışma
      if (existing.fingerprint !== fingerprint) throw new BadRequestException('Idempotency-Key çakışması: aynı key farklı içerikle kullanıldı');
      // Eşleşiyorsa: ya tamamlanmış (cache'lenen response'u dön), ya da processing (409)
      if (existing.status === 'COMPLETED') {
        res.setHeader('Idempotent-Replay', 'true');
        return res.status(existing.statusCode ?? 200).json(existing.response);
      }
      if (existing.status === 'PROCESSING') {
        res.setHeader('Retry-After', '2');
        return res.status(409).json({ error: 'İşlem devam ediyor, lütfen bekleyin' });
      }
    }

    // Yeni key, processing olarak kaydet
    await this.prisma.client.idempotencyKey.create({ data: { key: `${tenantId}:${key}`, tenantId, fingerprint, method: req.method, url: req.originalUrl, status: 'PROCESSING' } });

    // Response'u intercept et
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      // Async kaydet
      this.prisma.client.idempotencyKey.update({
        where: { key: `${tenantId}:${key}` },
        data: { status: 'COMPLETED', statusCode: res.statusCode, response: body, completedAt: new Date(), expiresAt: new Date(Date.now() + TTL_HOURS * 3600 * 1000) },
      }).catch(() => undefined);
      return originalJson(body);
    };

    next();
  }
}
