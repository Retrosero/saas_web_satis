import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { AIObservabilityService } from './ai-observability.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AIFeedbackType, AIAuditAction, AITrainingFormat } from '@saas/shared';

/**
 * Süper Admin AI Observability Endpoint'leri
 * Bu endpoint'lere sadece super admin (global tenant olmayan) erişebilir
 */
@ApiTags('ai-observability')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-observability')
export class AIObservabilityController {
  constructor(private readonly svc: AIObservabilityService) {}

  // ===== Global Dashboard =====
  @Get('stats')
  getStats(@Query('days') days?: string) {
    return this.svc.getGlobalStats(days ? Number(days) : 30);
  }

  // ===== Tüm Konuşmalar (cross-tenant) =====
  @Get('conversations')
  listConversations(@Query() q: any) {
    return this.svc.listAllConversations(q);
  }

  @Get('conversations/:id')
  getConversationDetail(@Param('id') id: string) {
    return this.svc.getConversationDetail(id);
  }

  // ===== Audit Loglar =====
  @Get('audit-logs')
  listAuditLogs(@Query() q: any) {
    return this.svc.listAuditLogs(q);
  }

  // ===== Training Data =====
  @Get('training-entries')
  listTrainingEntries(@Query() q: any) {
    return this.svc.listTrainingEntries(q);
  }

  @Post('training-entries/:id/correct')
  correctEntry(@Param('id') id: string, @Body() body: { correctedAnswer: string; feedbackNote?: string }) {
    return this.svc.submitCorrection(id, body.correctedAnswer, body.feedbackNote);
  }

  // ===== Datasets =====
  @Get('datasets')
  listDatasets() {
    return this.svc.listDatasets();
  }

  @Post('datasets')
  createDataset(@Req() req: any, @Body() body: { name: string; description?: string; format: AITrainingFormat; includeOnlyPositive?: boolean; includeCorrected?: boolean; filterModel?: string; filterFrom?: string; filterTo?: string }) {
    return this.svc.createDataset(body, req.user.id);
  }

  @Post('datasets/:id/generate')
  generateDataset(@Param('id') id: string) {
    return this.svc.generateDataset(id);
  }

  @Delete('datasets/:id')
  deleteDataset(@Param('id') id: string) {
    return this.svc.deleteDataset(id);
  }
}
