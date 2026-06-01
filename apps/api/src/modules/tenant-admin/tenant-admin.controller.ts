import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantAdminService } from './tenant-admin.service';
import type { JwtPayload } from '@saas/shared';

@ApiTags('tenant-admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('tenant-admin')
export class TenantAdminController {
  constructor(private readonly service: TenantAdminService) {}

  // -------- Tenant Info --------

  @Get('me')
  @ApiOperation({ summary: 'Mevcut tenant bilgisi' })
  async me(@CurrentUser() user: JwtPayload) {
    return this.service.getTenantInfo(user.tid);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Tenant bilgisi güncelle' })
  async updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() body: { name?: string; currency?: string; taxOffice?: string; taxNumber?: string; companyInfo?: Record<string, unknown> },
  ) {
    return this.service.updateTenantInfo(user.tid, body);
  }

  // -------- Subscription --------

  @Get('subscription')
  @ApiOperation({ summary: 'Aktif abonelik ve kullanım bilgisi' })
  async subscription(@CurrentUser() user: JwtPayload) {
    return this.service.getSubscriptionUsage(user.tid);
  }

  // -------- Modules --------

  @Get('modules')
  @ApiOperation({ summary: 'Aktif ve kullanılabilir modüller' })
  async modules(@CurrentUser() user: JwtPayload) {
    return this.service.getModules(user.tid);
  }

  @Post('modules/:code/toggle')
  @ApiOperation({ summary: 'Modül aç/kapat (manuel)' })
  async toggleModule(
    @CurrentUser() user: JwtPayload,
    @Param('code') code: string,
    @Body() body: { isActive: boolean },
  ) {
    return this.service.toggleModule(user.tid, code, body.isActive, user.sub);
  }

  // -------- Users --------

  @Get('users')
  @ApiOperation({ summary: 'Tenant kullanıcıları' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async listUsers(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('search') search?: string,
  ) {
    return this.service.listUsers(user.tid, {
      page: Number(page),
      pageSize: Number(pageSize),
      search,
    });
  }

  @Post('users')
  @ApiOperation({ summary: 'Yeni kullanıcı davet et' })
  async createUser(
    @CurrentUser() user: JwtPayload,
    @Body() body: { email: string; fullName: string; phone?: string; password: string; roleCode: string },
  ) {
    return this.service.createUser(user.tid, body);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Kullanıcı güncelle' })
  async updateUser(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { fullName?: string; phone?: string; status?: 'ACTIVE' | 'INACTIVE' | 'LOCKED' },
  ) {
    return this.service.updateUser(user.tid, id, body);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Kullanıcı sil (soft)' })
  async deleteUser(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.deleteUser(user.tid, id);
  }

  @Post('users/:id/role')
  @ApiOperation({ summary: 'Kullanıcıya rol ata' })
  async assignRole(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { roleCode: string },
  ) {
    return this.service.assignRole(user.tid, id, body.roleCode);
  }

  // -------- Roles --------

  @Get('roles')
  @ApiOperation({ summary: 'Tenant rolleri' })
  async listRoles(@CurrentUser() user: JwtPayload) {
    return this.service.listRoles(user.tid);
  }

  @Post('roles')
  @ApiOperation({ summary: 'Yeni rol oluştur' })
  async createRole(
    @CurrentUser() user: JwtPayload,
    @Body() body: { code: string; name: string; description?: string; permissionCodes: string[] },
  ) {
    return this.service.createRole(user.tid, body);
  }

  @Put('roles/:id/permissions')
  @ApiOperation({ summary: 'Rol yetkilerini güncelle' })
  async updateRolePermissions(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { permissionCodes: string[] },
  ) {
    return this.service.updateRolePermissions(user.tid, id, body.permissionCodes);
  }
}
