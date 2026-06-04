import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.module';

@Injectable()
export class RAGService {
  private readonly logger = new Logger(RAGService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Basit keyword-based retrieval
   * Production'da embedding + vector search (pgvector) kullanılabilir.
   * Şimdilik Postgres ILIKE ile arama.
   */
  async retrieve(tenantId: string, query: string, topK = 5, moduleFilter?: string): Promise<{ id: string; title: string; module: string; content: string; snippet: string; score: number }[]> {
    const keywords = this.extractKeywords(query);
    if (keywords.length === 0) return [];

    const where: any = { tenantId, isDeleted: false, status: 'ACTIVE' };
    if (moduleFilter) where.module = moduleFilter;

    // OR koşulu: herhangi bir keyword title veya content'te geçsin
    where.OR = keywords.flatMap((kw) => [
      { title: { contains: kw, mode: 'insensitive' } },
      { content: { contains: kw, mode: 'insensitive' } },
    ]);

    const articles = await this.prisma.client.helpArticle.findMany({ where, take: topK * 3 });

    // Skorlama: keyword eşleşme sayısı
    const scored = articles.map((a) => {
      const text = `${a.title} ${a.content}`.toLowerCase();
      let score = 0;
      for (const kw of keywords) {
        const matches = (text.match(new RegExp(kw.toLowerCase(), 'g')) ?? []).length;
        score += matches;
      }
      return { ...a, score };
    });

    return scored
      .filter((a) => a.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((a) => ({
        id: a.id,
        title: a.title,
        module: a.module,
        content: a.content,
        snippet: this.extractSnippet(a.content, keywords),
        score: a.score,
      }));
  }

  /**
   * Context için KB'den zenginleştirilmiş sistem prompt oluştur
   */
  async buildContextPrompt(tenantId: string, query: string, enabledModules: string[]): Promise<string> {
    const articles = await this.retrieve(tenantId, query, 5);
    if (articles.length === 0) return '';

    const sections = articles
      .filter((a) => enabledModules.length === 0 || enabledModules.includes(a.module))
      .map((a, i) => `[KB${i + 1}] Modül: ${a.module} | Başlık: ${a.title}\n${a.snippet}`)
      .join('\n\n');

    if (!sections) return '';
    return `\n\n### BİLGİ TABANI BAĞLAMI:\nAşağıdaki yardım içerikleri kullanıcının sorusuyla ilgili olabilir. Cevap verirken bu bilgileri kullan:\n\n${sections}\n\nBilgi tabanında yoksa "Bu konuda bilgim yok" de, uydurma.`;
  }

  /**
   * Türkçe stop-word'leri çıkar + basit stemming
   */
  private extractKeywords(query: string): string[] {
    const stopWords = new Set(['bir', 'bu', 'şu', 'o', 'ne', 'nasıl', 'nedir', 'için', 'ile', 've', 'veya', 'ama', 'fakat', 'mı', 'mi', 'mu', 'mü', 'ben', 'sen', 'biz', 'siz', 'onlar', 'şey', 'çok', 'az', 'daha', 'en', 'kadar', 'sonra', 'önce', 'şimdi', 'burada', 'orada']);
    return query
      .toLowerCase()
      .replace(/[^\wçğıöşüÇĞIİÖŞÜ\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !stopWords.has(w));
  }

  private extractSnippet(content: string, keywords: string[]): string {
    const lower = content.toLowerCase();
    let bestIdx = 0;
    let bestScore = 0;
    for (const kw of keywords) {
      const idx = lower.indexOf(kw.toLowerCase());
      if (idx >= 0 && (bestIdx === 0 || idx < bestIdx)) bestIdx = idx;
    }
    if (bestIdx === 0) return content.substring(0, 300);
    const start = Math.max(0, bestIdx - 100);
    return (start > 0 ? '...' : '') + content.substring(start, Math.min(content.length, bestIdx + 200)) + (content.length > bestIdx + 200 ? '...' : '');
  }
}
