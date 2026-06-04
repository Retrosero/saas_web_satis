import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ReturnsService } from './returns.service.js';
import { CreateReturnSchema, UpdateReturnSchema, ReturnActionSchema } from './dto/return.dto.js';
import type { JwtPayload, ReturnReason, ReturnSource, ReturnStatus } from '@saas/shared';

@ApiTags('returns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('returns')
export class ReturnsController {
  constructor(private readonly returns: ReturnsService) {}

  @Get()
  @ApiOperation({ summary: 'İade listesi' })
  list(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: ReturnStatus,
    @Query('reason') reason?: ReturnReason,
    @Query('source') source?: ReturnSource,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.returns.list(user.tid, {
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 25,
      search, customerId, status, reason, source,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'İade detayı' })
  getOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.returns.getById(user.tid, id);
  }

  @Post()
  @ApiOperation({ summary: 'Yeni iade oluştur (taslak)' })
  create(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const input = CreateReturnSchema.parse(body);
    return this.returns.create(user.tid, input, user.sub);
  }

  @Put(':id')
  @ApiOperation({ summary: 'İade güncelle (taslak/onay bekleyen)' })
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: unknown) {
    const input = UpdateReturnSchema.parse(body);
    return this.returns.update(user.tid, id, input, user.sub);
  }

  @Post(':id/action')
  @ApiOperation({ summary: 'İade aksiyonu (submit/approve/reject/complete/cancel)' })
  action(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: unknown) {
    const input = ReturnActionSchema.parse(body);
    switch (input.action) {
      case 'submit':   return this.returns.submit(user.tid, id, user.sub);
      case 'approve':  return this.returns.approve(user.tid, id, user.sub);
      case 'reject':   return this.returns.reject(user.tid, id, input.rejectionReason ?? '', user.sub);
      case 'complete': return this.returns.complete(user.tid, id, user.sub);
      case 'cancel':   return this.returns.cancel(user.tid, id, user.sub);
      default: throw new Error('Geçersiz aksiyon');
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'İade sil (soft delete)' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.returns.softDelete(user.tid, id, user.sub);
    return { ok: true };
  }
}
