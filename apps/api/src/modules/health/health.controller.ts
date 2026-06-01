import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.module';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Sağlık kontrolü' })
  async check(): Promise<{
    status: 'ok' | 'degraded';
    timestamp: string;
    uptime: number;
    database: 'up' | 'down';
  }> {
    let db: 'up' | 'down' = 'down';
    try {
      await this.prisma.client.$queryRaw`SELECT 1`;
      db = 'up';
    } catch {
      db = 'down';
    }
    return {
      status: db === 'up' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: db,
    };
  }
}
