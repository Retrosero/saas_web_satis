import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';
import type { PaginatedResponse } from '@saas/shared';
import type { NotificationType, NotificationCategory } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Tenant veya kullanıcı için bildirimleri listele. */
  async list(params: {
    tenantId: string | null;
    userId: string | null;
    isRead?: boolean;
    category?: string;
    page: number;
    pageSize: number;
  }): Promise<PaginatedResponse<any>> {
    const where: Record<string, unknown> = {
      OR: [
        { userId: params.userId ?? undefined },
        // userId null ise tüm tenant kullanıcılarına açık
        { userId: null, tenantId: params.tenantId },
      ],
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }],
    };
    if (params.tenantId) where.tenantId = params.tenantId;
    if (typeof params.isRead === 'boolean') where.isRead = params.isRead;
    if (params.category) where.category = params.category;

    const [data, total] = await Promise.all([
      this.prisma.client.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.client.notification.count({ where }),
    ]);
    return {
      data: data.map((n) => ({
        id: n.id,
        tenantId: n.tenantId,
        userId: n.userId,
        type: n.type,
        category: n.category,
        title: n.title,
        message: n.message,
        link: n.link,
        isRead: n.isRead,
        readAt: n.readAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
      })),
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages: Math.ceil(total / params.pageSize),
        hasNext: params.page * params.pageSize < total,
        hasPrev: params.page > 1,
      },
    };
  }

  /** Okunmamış bildirim sayısı (badge için). */
  async unreadCount(tenantId: string | null, userId: string | null): Promise<{ count: number }> {
    const count = await this.prisma.client.notification.count({
      where: {
        OR: [{ userId: userId ?? undefined }, { userId: null, tenantId }],
        isRead: false,
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }],
        ...(tenantId ? { tenantId } : {}),
      },
    });
    return { count };
  }

  /** Son 5 bildirim (Topbar dropdown için). */
  async recent(tenantId: string | null, userId: string | null, limit = 5) {
    const items = await this.prisma.client.notification.findMany({
      where: {
        OR: [{ userId: userId ?? undefined }, { userId: null, tenantId }],
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }],
        ...(tenantId ? { tenantId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return items.map((n) => ({
      id: n.id,
      type: n.type,
      category: n.category,
      title: n.title,
      message: n.message,
      link: n.link,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  /** Tek bir bildirimi okundu olarak işaretle. */
  async markAsRead(id: string, tenantId: string | null, userId: string | null) {
    const n = await this.prisma.client.notification.findUnique({ where: { id } });
    if (!n) throw new NotFoundException('Bildirim bulunamadı');
    // Tenant izolasyonu
    if (n.tenantId && tenantId && n.tenantId !== tenantId) {
      throw new ForbiddenException('Erişim yetkisi yok');
    }
    if (n.userId && n.userId !== userId) {
      throw new ForbiddenException('Erişim yetkisi yok');
    }
    if (n.isRead) return n;
    return this.prisma.client.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /** Tüm bildirimleri okundu olarak işaretle. */
  async markAllAsRead(tenantId: string | null, userId: string | null) {
    const result = await this.prisma.client.notification.updateMany({
      where: {
        OR: [{ userId: userId ?? undefined }, { userId: null, tenantId }],
        isRead: false,
        ...(tenantId ? { tenantId } : {}),
      },
      data: { isRead: true, readAt: new Date() },
    });
    return { updated: result.count };
  }

  /** Bildirim oluştur (yardımcı — diğer modüllerden çağrılır). */
  async create(input: {
    tenantId?: string | null;
    userId?: string | null;
    type?: NotificationType;
    category?: NotificationCategory;
    title: string;
    message: string;
    link?: string;
    metadata?: Record<string, unknown>;
    expiresAt?: Date;
  }) {
    return this.prisma.client.notification.create({
      data: {
        tenantId: input.tenantId ?? null,
        userId: input.userId ?? null,
        type: input.type ?? 'INFO',
        category: input.category ?? 'SYSTEM',
        title: input.title,
        message: input.message,
        link: input.link,
        metadata: input.metadata as never,
        expiresAt: input.expiresAt,
      },
    });
  }

  /** Bildirim sil (sadece kendi bildirimini). */
  async remove(id: string, tenantId: string | null, userId: string | null) {
    const n = await this.prisma.client.notification.findUnique({ where: { id } });
    if (!n) throw new NotFoundException('Bildirim bulunamadı');
    if (n.tenantId && tenantId && n.tenantId !== tenantId) {
      throw new ForbiddenException();
    }
    if (n.userId && n.userId !== userId) {
      throw new ForbiddenException();
    }
    await this.prisma.client.notification.delete({ where: { id } });
    return { deleted: true };
  }
}
