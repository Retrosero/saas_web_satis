import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@saas/shared';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Bildirim listesi' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  @ApiQuery({ name: 'category', required: false, type: String })
  list(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('isRead') isRead?: string,
    @Query('category') category?: string,
  ) {
    const tenantId = user.tid === 'SYSTEM' ? null : user.tid;
    return this.notifications.list({
      tenantId,
      userId: user.sub,
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      category,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Okunmamış bildirim sayısı' })
  async unreadCount(@CurrentUser() user: JwtPayload) {
    const tenantId = user.tid === 'SYSTEM' ? null : user.tid;
    return this.notifications.unreadCount(tenantId, user.sub);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Son 5 bildirim (dropdown için)' })
  async recent(@CurrentUser() user: JwtPayload, @Query('limit') limit = '5') {
    const tenantId = user.tid === 'SYSTEM' ? null : user.tid;
    return this.notifications.recent(tenantId, user.sub, Number(limit));
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Bildirimi okundu olarak işaretle' })
  async markAsRead(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const tenantId = user.tid === 'SYSTEM' ? null : user.tid;
    const n = await this.notifications.markAsRead(id, tenantId, user.sub);
    return {
      id: n.id,
      isRead: n.isRead,
      readAt: n.readAt?.toISOString() ?? null,
    };
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Tüm bildirimleri okundu olarak işaretle' })
  async markAllAsRead(@CurrentUser() user: JwtPayload) {
    const tenantId = user.tid === 'SYSTEM' ? null : user.tid;
    return this.notifications.markAllAsRead(tenantId, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Bildirimi sil' })
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const tenantId = user.tid === 'SYSTEM' ? null : user.tid;
    return this.notifications.remove(id, tenantId, user.sub);
  }
}
