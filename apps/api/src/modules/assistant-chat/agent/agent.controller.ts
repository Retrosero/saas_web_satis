import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../../common/guards/tenant.guard.js';
import { AgentService } from './agent.service';
import { AssistantChatService } from '../assistant-chat.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BadRequestException } from '@nestjs/common';

@ApiTags('assistant-agent')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('assistant-agent')
export class AgentController {
  constructor(
    private readonly agent: AgentService,
    private readonly chat: AssistantChatService,
  ) {}

  @Post('run')
  async run(@Req() req: any, @Body() body: { goal: string; context?: any; maxSteps?: number; model?: string; toolPermissions?: string[] }) {
    if (!body.goal) throw new BadRequestException('Hedef gerekli');
    // Chat service'teki tool registry'yi agent'a aktar
    const tools = (this.chat as any).tools as Map<string, any>;
    if (!tools || tools.size === 0) throw new BadRequestException('Tool registry boş');
    // Map<...> → { tools: Tool[] } array
    const toolMap = new Map<string, any>();
    for (const [code, tool] of tools.entries()) toolMap.set(code, tool);
    return this.agent.run(req.user.tenantId, req.user.id, toolMap, body);
  }
}
