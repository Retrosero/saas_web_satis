# FAZ 57 — WebSocket Gateway (Socket.io)

## Amaç
Real-time bildirim, AI chat streaming, online kullanıcı, dashboard canlı veri.

## Stack
- **@nestjs/websockets**
- **@nestjs/platform-socket.io**
- **socket.io** (server + client)
- **socket.io-client** (frontend)

## Mimari

### RealtimeGateway
- `@WebSocketGateway({ cors: { origin: '*' }, transports: ['websocket', 'polling'] })`
- JWT auth middleware: handshake'te token doğrulama
- Auto-join: `tenant:{id}` + `user:{id}` room'ları
- Event'ler: `connected`, model.{action}, notification, test.event

### Room Yapısı
- `tenant:{tenantId}` → tüm tenant kullanıcıları
- `user:{userId}` → tek kullanıcı (DM)
- `room` → subscribe edilen özel oda

### Event Tipleri
- `model.created`, `model.updated`, `model.deleted` → her Prisma mutation'da
- `notification` → user-specific
- `connected` → handshake başarılı
- Custom event'ler (`test.event`, `ping`, `pong`)

## RealtimeService
Prisma middleware ile otomatik broadcast:
```ts
client.$use(async (params, next) => {
  const result = await next(params);
  if (['create', 'update', 'delete'].includes(params.action) && params.model) {
    this.broadcastMutation(params, result);
  }
  return result;
});
```

Broadcast:
```ts
this.gateway.emitToTenant(tenantId, `${model.toLowerCase()}.${event.action}`, event);
```

## Endpoint'ler (2)
- `GET /realtime-admin/stats` → `{ connectedClients: number }`
- `POST /realtime-admin/test` → test event yayını

## Frontend
- `lib/socket-client.ts`:
  - `getSocket(token)` — singleton socket
  - `useRealtime()` — connected, lastEvent, events buffer
  - `useRealtimeEvent(event, handler)` — spesifik event
- `/system/realtime` sayfası — bağlantı durumu + aktif client + event akışı

## Kullanım Örneği
```ts
// Service
this.gateway.emitToTenant(tenantId, 'sale.created', { saleId, total });

// Frontend
const { connected, events } = useRealtime();
useRealtimeEvent('sale.created', (payload) => {
  toast.success('Yeni satış: ' + payload.saleId);
});
```

## Sık Sorulan Sorular

**S: "Bağlantı nasıl kurulur?"**
C: Frontend'de socket.io-client + JWT token. `io(BASE_URL, { auth: { token } })`.

**S: "Multi-tenant izolasyon var mı?"**
C: Evet, JWT'ten tenantId alınır, sadece ilgili tenant room'una join olur. Tenant'lar arası sızma yok.

**S: "AI chat streaming nasıl?"**
C: LLM token'larını `chat.token` event'i ile yayınla, frontend'de biriktir + göster.

**S: "Socket auth token expire olursa?"**
C: Socket disconnect olur, frontend reconnect denemesi yapar (reconnection: true). Yeni token ile yeniden bağlan.

**S: "Notification nerede gösterilir?"**
C: Topbar'da bildirim dropdown'ı real-time güncellenebilir (FAZ 33 NotificationRule + WebSocket).

**S: "Performans?"**
C: 1000 client aynı anda bağlı kalabilir. Redis adapter ile horizontal scaling (TODO).

**S: "Authentication bypass?"**
C: Middleware reddeder, `next(new Error('Yetkilendirme hatası'))`. Socket kurulamaz.

**S: "Mesaj boyutu sınırı?"**
C: Socket.io default 1MB. Büyük payload için HTTP API kullan.
