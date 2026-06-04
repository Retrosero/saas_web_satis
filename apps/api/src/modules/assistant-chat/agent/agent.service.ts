import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.module';
import { createAdapter, type ChatMessage, type ToolDefinition, LLMAdapter } from '../llm/llm.adapter';

export type AgentStepStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
export type AgentRunStatus = 'PLANNING' | 'EXECUTING' | 'REFLECTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface AgentStep {
  id: string;
  order: number;
  description: string;
  toolCode?: string;
  toolArguments?: Record<string, any>;
  dependsOn: string[]; // step id listesi
  status: AgentStepStatus;
  result?: any;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  retryCount: number;
  maxRetries: number;
}

export interface AgentPlan {
  goal: string;
  steps: AgentStep[];
  reasoning?: string;
}

export interface AgentRunResult {
  runId: string;
  plan: AgentPlan;
  finalAnswer: string;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  totalDurationMs: number;
  totalCostUSD: number;
  status: AgentRunStatus;
}

interface AgentRunInput {
  goal: string;
  context?: Record<string, any>;
  maxSteps?: number;
  model?: string;
  toolPermissions?: string[]; // boş = tüm aktif tool'lar
}

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Plan + Execute + Reflect
  async run(tenantId: string, userId: string, tools: Map<string, { name: string; description: string; definition: any; execute: Function }>, input: AgentRunInput): Promise<AgentRunResult> {
    const start = Date.now();
    const config = await this.prisma.client.tenantLLMConfig.findUnique({ where: { tenantId } });
    if (!config || !config.isActive) throw new Error('LLM aktif değil');

    const adapter = createAdapter(config.provider, config.apiKey, config.baseUrl ?? undefined);
    const model = input.model ?? config.defaultModel;
    const maxSteps = input.maxSteps ?? 8;

    // 1. PLAN
    this.logger.log(`Planning agent run for goal: ${input.goal}`);
    const plan = await this.planSteps(adapter, model, input.goal, tools, input.toolPermissions ?? [], config.enabledModules as string[]);

    // 2. EXECUTE — sıralı (dependency'ye göre)
    const toolDefs: ToolDefinition[] = Object.values(tools).map((t) => t.definition);
    const executedPlan: AgentPlan = { ...plan, steps: [...plan.steps] };
    let totalCost = 0;
    for (const step of executedPlan.steps) {
      const deps = step.dependsOn ?? [];
      const depsMet = deps.every((depId) => executedPlan.steps.find((s) => s.id === depId)?.status === 'COMPLETED');
      if (!depsMet) {
        step.status = 'SKIPPED';
        step.error = 'Bağımlılıklar tamamlanmadı';
        continue;
      }
      const stepStart = Date.now();
      step.status = 'RUNNING';
      step.startedAt = new Date().toISOString();
      let stepResult: any = null;
      let stepError: string | undefined;
      let attempt = 0;
      while (attempt <= step.maxRetries) {
        try {
          const tool = tools.get(step.toolCode!);
          if (!tool) throw new Error(`Tool bulunamadı: ${step.toolCode}`);
          stepResult = await tool.execute(step.toolArguments ?? {}, { tenantId, userId, userPermissions: [] });
          break;
        } catch (e: any) {
          attempt++;
          step.retryCount = attempt;
          if (attempt > step.maxRetries) {
            stepError = e.message;
            step.status = 'FAILED';
            step.error = e.message;
            step.completedAt = new Date().toISOString();
            step.durationMs = Date.now() - stepStart;
            this.logger.warn(`Step ${step.id} failed after ${attempt} attempts: ${e.message}`);
            break;
          }
          // 1 saniye bekle, tekrar dene
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
      if (step.status !== 'FAILED') {
        step.status = stepResult?.success === false ? 'FAILED' : 'COMPLETED';
        step.result = stepResult;
        step.error = stepError ?? stepResult?.error;
        step.completedAt = new Date().toISOString();
        step.durationMs = Date.now() - stepStart;
      }
    }

    // 3. REFLECT — sonuçları özetle
    const reflectPrompt = this.buildReflectPrompt(executedPlan, input.goal);
    const reflectRes = await adapter.chat({
      model,
      messages: [
        { role: 'system', content: 'Sen bir agent sonuç yorumlayıcısısın. Verilen adımların sonuçlarını kullanıcıya sunulacak şekilde Türkçe özetle. Başarı/başarısızlık durumunu belirt, önemli verileri vurgula. Kısa ve öz ol.' },
        { role: 'user', content: reflectPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });
    const finalAnswer = reflectRes.choices[0]?.message?.content ?? 'Sonuç üretilemedi';
    totalCost += this.estimateCost(model, reflectRes.usage?.prompt_tokens ?? 0, reflectRes.usage?.completion_tokens ?? 0);

    const completedSteps = executedPlan.steps.filter((s) => s.status === 'COMPLETED').length;
    const failedSteps = executedPlan.steps.filter((s) => s.status === 'FAILED').length;
    const allCompleted = failedSteps === 0;

    return {
      runId: `run-${Date.now()}`,
      plan: executedPlan,
      finalAnswer,
      totalSteps: executedPlan.steps.length,
      completedSteps,
      failedSteps,
      totalDurationMs: Date.now() - start,
      totalCostUSD: totalCost,
      status: allCompleted ? 'COMPLETED' : failedSteps === executedPlan.steps.length ? 'FAILED' : 'COMPLETED',
    };
  }

  private async planSteps(adapter: LLMAdapter, model: string, goal: string, tools: Map<string, { name: string; description: string; definition: any; execute: Function }>, allowedTools: string[], enabledModules: string[]): Promise<AgentPlan> {
    const toolList = Array.from(tools.values())
      .filter((t) => allowedTools.length === 0 || allowedTools.includes(t.definition.function.name))
      .map((t) => `- ${t.definition.function.name}: ${t.definition.function.description}`)
      .join('\n');

    const sysPrompt = `Sen bir agent planlayıcısısın. Kullanıcının amacına ulaşmak için sıralı adım planı oluştur.

## Mevcut Araçlar:
${toolList}

## Erişilebilir Modüller: ${enabledModules.join(', ')}

## Çıktı Formatı (JSON):
{
  "reasoning": "Plan gerekçesi (Türkçe, 1-2 cümle)",
  "steps": [
    {
      "id": "step-1",
      "description": "Adımın ne yaptığı (Türkçe)",
      "toolCode": "tool_name",
      "toolArguments": { ... },
      "dependsOn": [],
      "maxRetries": 1
    }
  ]
}

## Kurallar:
- Maks ${8} adım
- Her adım bir tool çağrısı içermeli
- dependsOn başka step id'lerini referans alır
- maxRetries: 0-3 arası
- Gereksiz adım ekleme
- Araç yoksa boş steps dizisi döndür
- SADECE JSON çıktı ver, başka açıklama yapma`;

    try {
      const res = await adapter.chat({
        model,
        messages: [
          { role: 'system', content: sysPrompt },
          { role: 'user', content: `Hedef: ${goal}` },
        ],
        temperature: 0.2,
        max_tokens: 1500,
      });
      const text = res.choices[0]?.message?.content ?? '{}';
      // JSON extract (markdown ```json ... ``` wrapper olabilir)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Plan JSON çıkarılamadı');
      const parsed = JSON.parse(jsonMatch[0]);
      const steps: AgentStep[] = (parsed.steps ?? []).map((s: any, i: number) => ({
        id: s.id ?? `step-${i + 1}`,
        order: i + 1,
        description: s.description ?? '',
        toolCode: s.toolCode,
        toolArguments: s.toolArguments,
        dependsOn: s.dependsOn ?? [],
        status: 'PENDING',
        retryCount: 0,
        maxRetries: s.maxRetries ?? 1,
      }));
      return { goal, steps, reasoning: parsed.reasoning };
    } catch (e: any) {
      this.logger.error(`Plan oluşturulamadı: ${e.message}`);
      return { goal, steps: [], reasoning: e.message };
    }
  }

  private buildReflectPrompt(plan: AgentPlan, goal: string): string {
    let p = `Hedef: ${goal}\n\nAdım Sonuçları:\n`;
    for (const s of plan.steps) {
      const statusEmoji = s.status === 'COMPLETED' ? '✅' : s.status === 'FAILED' ? '❌' : s.status === 'SKIPPED' ? '⏭️' : '⏳';
      p += `${statusEmoji} Adım ${s.order}: ${s.description}\n`;
      if (s.toolCode) p += `   Tool: ${s.toolCode} (${s.durationMs ?? 0}ms)\n`;
      if (s.result?.display) p += `   Sonuç: ${s.result.display.substring(0, 500)}\n`;
      if (s.error) p += `   Hata: ${s.error}\n`;
      p += '\n';
    }
    p += '\nBu sonuçları kullanıcıya sunulacak şekilde Türkçe özetle. Önemli sayıları ve bulguları vurgula.';
    return p;
  }

  private estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing: Record<string, { in: number; out: number }> = {
      'deepseek/deepseek-chat': { in: 0.14, out: 0.28 },
      'openai/gpt-4o-mini': { in: 0.15, out: 0.60 },
      'anthropic/claude-3.5-haiku': { in: 0.80, out: 4.00 },
    };
    const p = pricing[model] ?? { in: 0.50, out: 1.00 };
    return (inputTokens / 1_000_000) * p.in + (outputTokens / 1_000_000) * p.out;
  }
}
