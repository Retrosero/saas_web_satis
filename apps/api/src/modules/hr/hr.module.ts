import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { ConfigModule } from '@nestjs/config';

import { HrEmployeesController } from './hr-employees.controller.js';
import { HrEmployeesService } from './hr-employees.service.js';
import { HrDocumentsController } from './hr-documents.controller.js';
import { HrDocumentsService } from './hr-documents.service.js';
import { HrChecklistsController } from './hr-checklists.controller.js';
import { HrChecklistsService } from './hr-checklists.service.js';
import { HrLeaveController } from './hr-leave.controller.js';
import { HrLeaveService } from './hr-leave.service.js';
import { HrPayrollController } from './hr-payroll.controller.js';
import { HrPayrollService } from './hr-payroll.service.js';
import { HrPayrollParamService } from './hr-payroll-param.service.js';
import { HrAbsenceService } from './hr-hr6-7.service.js';
import { HrHr567Controller } from './hr-hr567.controller.js';
import { HrPunchAdvanceController } from './hr-punch-advance.controller.js';
import { HrPunchService, HrAdvanceService } from './hr-punch-advance.service.js';
import { HrExportService } from './hr-export.service.js';
import { HrStorageService } from './common/hr-storage.service.js';
import { HrPermissionGuard } from './common/hr-permission.guard.js';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [
    HrEmployeesController,
    HrDocumentsController,
    HrChecklistsController,
    HrLeaveController,
    HrPayrollController,
    HrHr567Controller,
    HrPunchAdvanceController,
  ],
  providers: [
    HrEmployeesService,
    HrDocumentsService,
    HrChecklistsService,
    HrLeaveService,
    HrPayrollService,
    HrPayrollParamService,
    HrAbsenceService,
    HrPunchService,
    HrAdvanceService,
    HrExportService,
    HrStorageService,
    HrPermissionGuard,
  ],
  exports: [HrEmployeesService, HrDocumentsService, HrChecklistsService, HrLeaveService, HrPayrollService, HrPayrollParamService, HrAbsenceService, HrPunchService, HrAdvanceService, HrExportService, HrStorageService],
})
export class HrModule {}