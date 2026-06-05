import { Module, OnModuleInit } from '@nestjs/common';
import { AssistantChatController } from './assistant-chat.controller';
import { AssistantChatService } from './assistant-chat.service';
import { RAGService } from './llm/rag.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module.js';
import { GetCustomerBalanceTool } from './tools/builtin-tools';
import { ListCustomerPendingSalesTool } from './tools/builtin-tools';
import { CheckProductStockTool } from './tools/builtin-tools';
import { GetDashboardSummaryTool } from './tools/builtin-tools';
import { CreateSaleTool, CreateCollectionTool, SearchProductsTool, ListCustomersTool, TodaySalesTool, TopProductsTool, OverdueCollectionsTool } from './tools/builtin-tools-v2';
import { AIObservabilityService } from './ai-observability/ai-observability.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AssistantChatController],
  providers: [
    AssistantChatService,
    RAGService,
    AIObservabilityService,
    GetCustomerBalanceTool,
    ListCustomerPendingSalesTool,
    CheckProductStockTool,
    GetDashboardSummaryTool,
    CreateSaleTool,
    CreateCollectionTool,
    SearchProductsTool,
    ListCustomersTool,
    TodaySalesTool,
    TopProductsTool,
    OverdueCollectionsTool,
  ],
  exports: [AssistantChatService],
})
export class AssistantChatModule implements OnModuleInit {
  constructor(
    private readonly chatService: AssistantChatService,
    private readonly observability: AIObservabilityService,
    private readonly getCustomerBalance: GetCustomerBalanceTool,
    private readonly listCustomerPendingSales: ListCustomerPendingSalesTool,
    private readonly checkProductStock: CheckProductStockTool,
    private readonly getDashboardSummary: GetDashboardSummaryTool,
    private readonly createSale: CreateSaleTool,
    private readonly createCollection: CreateCollectionTool,
    private readonly searchProducts: SearchProductsTool,
    private readonly listCustomers: ListCustomersTool,
    private readonly todaySales: TodaySalesTool,
    private readonly topProducts: TopProductsTool,
    private readonly overdueCollections: OverdueCollectionsTool,
  ) {}

  onModuleInit() {
    this.chatService.initTools([
      this.getCustomerBalance,
      this.listCustomerPendingSales,
      this.checkProductStock,
      this.getDashboardSummary,
      this.createSale,
      this.createCollection,
      this.searchProducts,
      this.listCustomers,
      this.todaySales,
      this.topProducts,
      this.overdueCollections,
    ]);
    this.chatService.setObservability(this.observability);
  }
}
