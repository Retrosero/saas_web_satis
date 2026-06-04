import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { AssistantChatService } from './assistant-chat.service';
import { RAGService } from './llm/rag.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LLMProvider, AssistantConversationStatus } from '@saas/shared';

@ApiTags('assistant-chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('assistant-chat')
export class AssistantChatController {
  constructor(
    private readonly svc: AssistantChatService,
    private readonly rag: RAGService,
  ) {}

  // ===== LLM Config =====
  @Get('config')
  getConfig(@Req() req: any) {
    return this.svc.getLLMConfig(req.user.tenantId);
  }

  @Post('config')
  upsertConfig(@Req() req: any, @Body() body: any) {
    return this.svc.upsertLLMConfig(req.user.tenantId, body, req.user.id);
  }

  @Delete('config')
  deleteConfig(@Req() req: any) {
    return this.svc.deleteLLMConfig(req.user.tenantId);
  }

  @Post('config/test')
  testConfig(@Req() req: any, @Body() body: { provider: LLMProvider; apiKey: string; baseUrl?: string; defaultModel?: string }) {
    return this.svc.testConnection(req.user.tenantId, body);
  }

  // ===== Chat =====
  @Post('chat')
  sendMessage(@Req() req: any, @Body() body: { conversationId?: string; message: string; model?: string; temperature?: number; maxTokens?: number; stream?: boolean; context?: any }) {
    return this.svc.chat(req.user.tenantId, req.user.id, body);
  }

  @Post('chat/stream')
  async chatStream(@Req() req: any, @Body() body: { conversationId?: string; message: string; model?: string; temperature?: number; maxTokens?: number }, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    try {
      await this.svc.chatStream(req.user.tenantId, req.user.id, body, (text) => {
        res.write(`data: ${JSON.stringify({ type: 'content', text })}\n\n`);
      });
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    } catch (e: any) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: e.message })}\n\n`);
      res.end();
    }
  }

  // ===== Conversations =====
  @Get('conversations')
  listConversations(@Req() req: any, @Query('status') status?: AssistantConversationStatus, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.svc.listConversations(req.user.tenantId, req.user.id, { status, page: page ? Number(page) : undefined, pageSize: pageSize ? Number(pageSize) : undefined });
  }

  @Get('conversations/:id')
  getConversation(@Req() req: any, @Param('id') id: string) {
    return this.svc.getConversation(req.user.tenantId, req.user.id, id);
  }

  @Put('conversations/:id')
  updateConversation(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateConversation(req.user.tenantId, req.user.id, id, body);
  }

  @Delete('conversations/:id')
  deleteConversation(@Req() req: any, @Param('id') id: string) {
    return this.svc.deleteConversation(req.user.tenantId, req.user.id, id);
  }

  @Post('messages/:id/rate')
  rateMessage(@Req() req: any, @Param('id') id: string, @Body() body: { rating: number; note?: string }) {
    return this.svc.rateMessage(req.user.tenantId, req.user.id, id, body.rating, body.note);
  }

  // ===== Stats =====
  @Get('stats')
  stats(@Req() req: any, @Query('days') days?: string) {
    return this.svc.getUsageStats(req.user.tenantId, days ? Number(days) : 30);
  }

  // ===== KB =====
  @Get('kb/search')
  searchKB(@Req() req: any, @Query('q') q: string, @Query('module') module?: string) {
    return this.rag.retrieve(req.user.tenantId, q, 5, module);
  }
}
