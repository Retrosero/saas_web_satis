import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { HrPermissionGuard } from './common/hr-permission.guard.js';
import { RequireHrPermission } from './common/require-permission.decorator.js';
import { HrEmployeesService } from './hr-employees.service.js';
import { HrDocumentsService } from './hr-documents.service.js';
import {
  CreateHrEmployeeDto,
  FilterHrEmployeeDto,
  UpdateHrEmployeeDto,
  type JwtPayload,
} from '@saas/shared';

@ApiTags('hr-employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, HrPermissionGuard)
@Controller('hr/employees')
export class HrEmployeesController {
  constructor(
    private readonly employees: HrEmployeesService,
    private readonly documents: HrDocumentsService,
  ) {}

  @Get()
  @RequireHrPermission('ik:personnel:view')
  @ApiOperation({ summary: 'Personel listesi' })
  async list(
    @CurrentUser() user: JwtPayload,
    @Query() q: FilterHrEmployeeDto,
  ) {
    return this.employees.list(user.tid, q, user);
  }

  @Get('meta/departments')
  @RequireHrPermission('ik:personnel:view')
  async getDepartments(@CurrentUser() user: JwtPayload) {
    return this.employees.getDepartments(user.tid);
  }

  @Get('meta/branches')
  @RequireHrPermission('ik:personnel:view')
  async getBranches(@CurrentUser() user: JwtPayload) {
    return this.employees.getBranches(user.tid);
  }

  @Get(':id')
  @RequireHrPermission('ik:personnel:view')
  @ApiOperation({ summary: 'Personel detayı' })
  async get(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.employees.get(user.tid, id, user);
  }

  @Get(':id/sensitive')
  @RequireHrPermission('ik:sensitive_data:view')
  @ApiOperation({ summary: 'Personel hassas verileri (TC, IBAN) — sadece yetkili' })
  async getSensitive(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.employees.getSensitive(user.tid, id, user);
  }

  @Post()
  @RequireHrPermission('ik:personnel:create')
  @ApiOperation({ summary: 'Yeni personel' })
  async create(
    @Body() body: CreateHrEmployeeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.employees.create(user.tid, body, user);
  }

  @Put(':id')
  @RequireHrPermission('ik:personnel:update')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateHrEmployeeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.employees.update(user.tid, id, body, user);
  }

  @Patch(':id/terminate')
  @RequireHrPermission('ik:personnel:update')
  async terminate(
    @Param('id') id: string,
    @Body() body: { terminationDate: string; reason: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.employees.terminate(user.tid, id, body, user);
  }

  @Delete(':id')
  @RequireHrPermission('ik:personnel:delete')
  @ApiOperation({ summary: 'Personeli arşivle (soft delete)' })
  async archive(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.employees.archive(user.tid, id, user);
  }

  @Get(':id/documents')
  @RequireHrPermission('ik:documents:view')
  async listDocuments(
    @Param('id') employeeId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.documents.list(user.tid, employeeId, user);
  }
}
