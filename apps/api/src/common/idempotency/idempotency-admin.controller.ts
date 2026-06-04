import { Controller, Get, Delete, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { PrismaService } from '../../prisma/prisma.module';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('idempotency-admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('idempotency-admin')
export class IdempotencyAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('stats')
  async stats() {
    const total = await this.prisma.client.idempotencyKey.count();
    const processing = await this.prisma.client.idempotencyKey.count({ where: { status: 'PROCESSING' } });
    const completed = await this.prisma.client.idempotencyKey.count({ where: { status: 'COMPLETED' } });
    const expired = await this.prisma.client.idempotencyKey.count({ where: { expiresAt: { lt: new Date() } } });
    return { total, processing, completed, expired };
  }

  @Delete('cleanup')
  async cleanup() {
    const result = await this.prisma.client.idempotencyKey.deleteMany({ where: { OR: [{ expiresAt: { lt: new Date() } }, { createdAt: { lt: new Date(Date.now() - 7 * 24 * 3600 * 1000) } }] } });
    return { ok: true, deleted: result.count };
  }

  @Get('keys')
  async list(@Query('limit') limit = '30') { return this.prisma.client.idempotencyKey.findMany({ orderBy: { createdAt: 'desc' }, take: Number(limit) }); }
}
