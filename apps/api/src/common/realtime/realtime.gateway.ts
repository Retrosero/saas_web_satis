import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: { origin: '*' }, transports: ['websocket', 'polling'] })
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);
  @WebSocketServer() server!: Server;

  constructor(private readonly jwt: JwtService) {}

  afterInit(server: Server) {
    this.logger.log('Socket.io gateway hazır');
    server.use((socket: Socket, next) => {
      try {
        const token = socket.handshake.auth?.token ?? socket.handshake.query?.token;
        if (!token) return next(new Error('Yetkilendirme hatası'));
        const payload: any = this.jwt.verify(token, { secret: process.env.JWT_SECRET ?? 'dev-secret' });
        (socket.data as any).user = payload;
        next();
      } catch (e: any) { next(new Error('Geçersiz token: ' + e.message)); }
    });
  }

  handleConnection(socket: Socket) {
    const user: any = (socket.data as any).user;
    if (user?.tenantId) {
      const tenantRoom = `tenant:${user.tenantId}`;
      const userRoom = `user:${user.id}`;
      socket.join(tenantRoom);
      socket.join(userRoom);
      this.logger.log(`WS bağlandı: tenant=${user.tenantId} user=${user.id} sid=${socket.id}`);
      socket.emit('connected', { sid: socket.id, tenantId: user.tenantId, userId: user.id });
    }
  }

  handleDisconnect(socket: Socket) {
    this.logger.log(`WS ayrıldı: ${socket.id}`);
  }

  // === Public API (service'ten çağrılır) ===
  emitToTenant(tenantId: string, event: string, payload: any) { this.server.to(`tenant:${tenantId}`).emit(event, payload); }
  emitToUser(userId: string, event: string, payload: any) { this.server.to(`user:${userId}`).emit(event, payload); }
  emitToAll(event: string, payload: any) { this.server.emit(event, payload); }

  // === Client event'leri ===
  @SubscribeMessage('ping')
  handlePing(@MessageBody() data: any) { return { pong: true, ts: Date.now(), echo: data }; }
  @SubscribeMessage('join')
  handleJoin(@MessageBody() room: string, @ConnectedSocket() socket: Socket) { socket.join(room); return { ok: true, room }; }
}
