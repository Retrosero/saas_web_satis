import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { HrPermissionGuard } from './common/hr-permission.guard';
import { RequireHrPermission } from './common/require-permission.decorator';
import { HrDocumentsService } from './hr-documents.service';
import type { JwtPayload } from '@saas/shared';

@ApiTags('hr-documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, HrPermissionGuard)
@Controller('hr/documents')
export class HrDocumentsController {
  constructor(private readonly documents: HrDocumentsService) {}

  @Get(':id/download')
  @RequireHrPermission('ik:documents:read')
  @ApiOperation({ summary: 'Evrak indir (her indirme loglanır)' })
  async download(
    @Param('id') documentId: string,
    @Res() res: Response,
    @CurrentUser() user: JwtPayload,
  ) {
    const { buffer, fileName, mimeType } = await this.documents.download(user.tid, documentId, user);
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      'Content-Length': buffer.length.toString(),
    });
    res.send(buffer);
  }

  @Post('upload/:employeeId')
  @RequireHrPermission('ik:documents:create')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        documentType: { type: 'string' },
        title: { type: 'string' },
        issueDate: { type: 'string', format: 'date' },
        expiryDate: { type: 'string', format: 'date' },
        description: { type: 'string' },
      },
      required: ['file', 'documentType', 'title'],
    },
  })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  async upload(
    @Param('employeeId') employeeId: string,
    @UploadedFile() file: any,
    @Body() body: { documentType: string; title: string; issueDate?: string; expiryDate?: string; description?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.documents.upload(user.tid, employeeId, file, body, user);
  }

  @Patch(':id/status')
  @RequireHrPermission('ik:documents:update')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED' },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.documents.updateStatus(user.tid, id, body.status, user);
  }

  @Delete(':id')
  @RequireHrPermission('ik:documents:delete')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.documents.delete(user.tid, id, user);
  }
}
