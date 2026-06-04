import { io, Socket } from 'socket.io-client';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (socket && socket.connected) return socket;
  const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1').replace(/\/api\/v1$/, '');
  socket = io(baseUrl, { auth: { token }, transports: ['websocket', 'polling'], reconnection: true, reconnectionDelay: 1000 });
  return socket;
}

export function disconnectSocket() { socket?.disconnect(); socket = null; }

export function useRealtime() {
  const token = useAuthStore((s) => s.accessToken);
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<{ event: string; payload: any; ts: number } | null>(null);
  const [events, setEvents] = useState<{ event: string; payload: any; ts: number }[]>([]);

  useEffect(() => {
    if (!token) return;
    const s = getSocket(token);
    socketRef.current = s;
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onAny = (event: string, payload: any) => {
      const ev = { event, payload, ts: Date.now() };
      setLastEvent(ev);
      setEvents((prev) => [ev, ...prev].slice(0, 50));
    };
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.onAny(onAny);
    if (s.connected) setConnected(true);
    return () => { s.off('connect', onConnect); s.off('disconnect', onDisconnect); s.offAny(onAny); };
  }, [token]);

  return { connected, lastEvent, events, socket: socketRef.current, clear: () => setEvents([]) };
}

export function useRealtimeEvent(event: string, handler: (payload: any) => void) {
  const { socket } = useRealtime();
  useEffect(() => {
    if (!socket) return;
    socket.on(event, handler);
    return () => { socket.off(event, handler); };
  }, [socket, event, handler]);
}
