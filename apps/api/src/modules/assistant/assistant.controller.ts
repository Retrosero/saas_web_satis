import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { AssistantService } from './assistant.service.js';
import type { AssistantToolStatus, HelpContentType, JwtPayload } from '@saas/shared';

@ApiTags('assistant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('assistant')
export class AssistantController {
  constructor(private readonly svc: AssistantService) {}

  // ===== HELP ARTICLES =====
  @Get('articles')
  listArticles(
    @CurrentUser() u: JwtPayload,
    @Query('search') search?: string,
    @Query('module') module?: string,
    @Query('contentType') contentType?: HelpContentType,
    @Query('status') status?: 'ACTIVE' | 'PASSIVE',
  ) {
    return this.svc.listArticles(u.tid, { search, module, contentType, status });
  }

  @Get('articles/:id')
  getArticle(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.getArticle(u.tid, id);
  }

  @Post('articles')
  createArticle(@CurrentUser() u: JwtPayload, @Body() body: { module: string; page?: string; title: string; content: string; contentType: HelpContentType; permissionKey?: string; status?: 'ACTIVE' | 'PASSIVE' }) {
    return this.svc.createArticle(u.tid, body, u.sub);
  }

  @Put('articles/:id')
  updateArticle(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateArticle(u.tid, id, body);
  }

  @Delete('articles/:id')
  async deleteArticle(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    await this.svc.deleteArticle(u.tid, id);
    return { ok: true };
  }

  // ===== TOOLS =====
  @Get('tools')
  listTools(@CurrentUser() u: JwtPayload) {
    return this.svc.listTools(u.tid);
  }

  @Post('tools')
  createTool(@CurrentUser() u: JwtPayload, @Body() body: { code: string; name: string; description: string; module: string; requiredPermission: string; apiEndpoint: string; status?: AssistantToolStatus }) {
    return this.svc.createTool(u.tid, body);
  }

  @Put('tools/:id')
  updateTool(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateTool(u.tid, id, body);
  }

  @Delete('tools/:id')
  async deleteTool(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    await this.svc.deleteTool(u.tid, id);
    return { ok: true };
  }
}
