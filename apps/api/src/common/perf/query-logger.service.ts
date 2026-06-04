import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';

export interface QueryStat { query: string; durationMs: number; timestamp: number; model?: string; action?: string }
export interface SlowQuery { query: string; durationMs: number; model?: string; stack?: string }

@Injectable()
export class QueryLoggerService implements OnModuleInit {
  private readonly logger = new Logger('QueryLogger');
  private recent: QueryStat[] = [];
  private slowQueries: SlowQuery[] = [];
  private readonly maxRecent = 200;
  private readonly slowThresholdMs = 500;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Prisma client'a log handler ekle
    const client: any = (this.prisma as any).client;
    if (client) {
      client.$on('query' as any, (e: any) => {
        const stat: QueryStat = { query: e.query, durationMs: e.duration, timestamp: Date.now(), model: this.detectModel(e.query), action: this.detectAction(e.query) };
        this.recent.push(stat);
        if (this.recent.length > this.maxRecent) this.recent.shift();
        if (stat.durationMs > this.slowThresholdMs) {
          this.slowQueries.unshift({ query: stat.query, durationMs: stat.durationMs, model: stat.model, stack: new Error().stack });
          if (this.slowQueries.length > 50) this.slowQueries.pop();
          this.logger.warn(`SLOW QUERY (${stat.durationMs}ms): ${stat.model} - ${stat.query.slice(0, 200)}`);
        }
      });
      this.logger.log('Query logger aktif (threshold: ' + this.slowThresholdMs + 'ms)');
    }
  }

  private detectModel(q: string): string | undefined { const m = q.match(/FROM\s+"(\w+)"/i) ?? q.match(/INTO\s+"(\w+)"/i); return m?.[1]; }
  private detectAction(q: string): string { if (q.toLowerCase().startsWith('select')) return 'SELECT'; if (q.toLowerCase().startsWith('insert')) return 'INSERT'; if (q.toLowerCase().startsWith('update')) return 'UPDATE'; if (q.toLowerCase().startsWith('delete')) return 'DELETE'; return 'OTHER'; }

  getStats() {
    const last5min = this.recent.filter((q) => q.timestamp > Date.now() - 300_000);
    const durations = last5min.map((q) => q.durationMs);
    return {
      totalQueries: this.recent.length,
      last5MinCount: last5min.length,
      avgDuration: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      p95Duration: this.percentile(durations, 0.95),
      p99Duration: this.percentile(durations, 0.99),
      slowQueriesCount: this.slowQueries.length,
    };
  }

  private percentile(arr: number[], p: number): number { if (arr.length === 0) return 0; const sorted = [...arr].sort((a, b) => a - b); return sorted[Math.floor(sorted.length * p)] ?? 0; }

  getRecent(limit = 50) { return this.recent.slice(-limit).reverse(); }
  getSlow(limit = 30) { return this.slowQueries.slice(0, limit); }
  clear() { this.recent = []; this.slowQueries = []; }
}
