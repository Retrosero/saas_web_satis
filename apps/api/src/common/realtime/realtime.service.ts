import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { PrismaService } from '../../prisma/prisma.module';

export interface RealtimeEvent {
  type: 'notification' | 'sale' | 'collection' | 'quote' | 'order' | 'customer' | 'product' | 'system';
  action: 'created' | 'updated' | 'deleted' | 'viewed' | 'shared';
  entityId: string;
  title: string;
  message: string;
  data?: any;
  timestamp: string;
}

@Injectable()
export class RealtimeService implements OnModuleInit {
  private readonly logger = new Logger(RealtimeService.name);

  constructor(private readonly gateway: RealtimeGateway, private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Global Prisma middleware: tüm create/update/delete'leri WS'e yayınla
    const client: any = (this.prisma as any).client;
    if (!client) return;
    client.$use(async (params: any, next: any) => {
      const result = await next(params);
      if (['create', 'update', 'delete'].includes(params.action) && params.model) {
        try { this.broadcastMutation(params, result); } catch { /* ignore */ }
      }
      return result;
    });
    this.logger.log('Realtime Prisma middleware aktif');
  }

  private broadcastMutation(params: any, result: any) {
    const tenantId = result?.tenantId;
    if (!tenantId) return;
    const model = params.model;
    const event: RealtimeEvent = {
      type: this.modelToType(model),
      action: params.action === 'create' ? 'created' : params.action === 'update' ? 'updated' : 'deleted',
      entityId: result.id,
      title: `${model} ${params.action}`,
      message: `${model} #${result.id}`,
      data: { id: result.id, code: result.code, name: result.name, saleNumber: result.saleNumber, quoteNumber: result.quoteNumber },
      timestamp: new Date().toISOString(),
    };
    this.gateway.emitToTenant(tenantId, `${model.toLowerCase()}.${event.action}`, event);
  }

  private modelToType(model: string): RealtimeEvent['type'] {
    const map: Record<string, any> = { Sale: 'sale', Collection: 'collection', Quote: 'quote', Order: 'order', Customer: 'customer', Product: 'product' };
    return map[model] ?? 'system';
  }

  // Explicit broadcast helpers
  notifyUser(userId: string, payload: { title: string; message: string; type?: string }) {
    this.gateway.emitToUser(userId, 'notification', { ...payload, type: payload.type ?? 'info', timestamp: new Date().toISOString() });
  }

  notifyTenant(tenantId: string, event: string, payload: any) {
    this.gateway.emitToTenant(tenantId, event, { ...payload, timestamp: new Date().toISOString() });
  }

  getConnectedCount(): number {
    return this.gateway.server?.sockets?.sockets?.size ?? 0;
  }
}
