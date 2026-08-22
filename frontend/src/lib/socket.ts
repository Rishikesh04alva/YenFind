'use client';

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'], // Client-only transports
    });

    socket.on('connect', () => {
      console.log('⚡ [Socket.io] Connected to Campus Gateway:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ [Socket.io] Gateway connection error:', err.message);
    });
  }

  return socket;
}

export function joinUserRoom(userId: string) {
  if (typeof window === 'undefined') return;
  const s = getSocket();
  if (s && userId) {
    s.emit('join_user_room', userId);
  }
}

export function joinItemRoom(itemId: string) {
  if (typeof window === 'undefined') return;
  const s = getSocket();
  if (s && itemId) {
    s.emit('join_item_room', itemId);
  }
}

export function leaveItemRoom(itemId: string) {
  if (typeof window === 'undefined') return;
  const s = getSocket();
  if (s && itemId) {
    s.emit('leave_item_room', itemId);
  }
}
