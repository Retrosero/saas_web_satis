import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ImportService } from './import.service.js';
import type { ImportEntityType, ImportSource, ImportStatus, JwtPayload } from '@saas/shared';

@ApiTags('import')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('import')
export class ImportController {
  constructor(private readonly importer: ImportService) {}

  @Get('batches')
  list(@CurrentUser() u: JwtPayload, @Query('status') status?: ImportStatus, @Query('entityType') entityType?: ImportEntityType) {
    return this.importer.listBatches(u.tid, { status, entityType });
  }

  @Get('batches/:id')
  get(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.importer.getBatch(u.tid, id);
  }

  @Post('batches')
  create(@CurrentUser() u: JwtPayload, @Body() body: { name: string; source: ImportSource; entityType: ImportEntityType; fileName?: string; fileSize?: number }) {
    return this.importer.createBatch(u.tid, body, u.sub);
  }

  @Post('batches/:id/parse')
  parse(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() body: { content: string; fileName: string; fileSize: number }) {
    return this.importer.parseAndStore(u.tid, id, body.content, body.fileName, body.fileSize);
  }

  @Put('batches/:id/mapping')
  mapping(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() body: { mapping: Record<string, string> }) {
    return this.importer.setMapping(u.tid, id, body.mapping);
  }

  @Get('batches/:id/preview')
  preview(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.importer.getPreview(u.tid, id, page ? Number(page) : 1, pageSize ? Number(pageSize) : 50);
  }

  @Post('batches/:id/execute')
  execute(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.importer.execute(u.tid, id, u.sub);
  }

  @Post('batches/:id/rollback')
  rollback(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.importer.rollback(u.tid, id);
  }

  @Delete('batches/:id')
  async remove(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    await this.importer.softDeleteBatch(u.tid, id);
    return { ok: true };
  }
}
