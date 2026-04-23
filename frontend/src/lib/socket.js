/**
 * socket.js — Graceful no-op on Vercel (no WebSocket server available)
 * On local dev it connects to the Node backend; on Vercel it silently skips.
 */

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : null; // No socket on Vercel production

let socket = null;

// Tiny no-op event emitter so callers don't crash when socket is null
const NOOP_SOCKET = {
  on: () => {},
  emit: () => {},
  disconnect: () => {},
  connected: false,
};

export const initSocket = () => {
  if (!SOCKET_URL) {
    console.info('ℹ️  WebSocket disabled (no VITE_API_URL set — running on Vercel)');
    socket = NOOP_SOCKET;
    return socket;
  }
  if (!socket) {
    import('socket.io-client').then(({ io }) => {
      socket = io(SOCKET_URL, { transports: ['websocket'], reconnectionAttempts: 3 });
      socket.on('connect', () => console.log('🔗 WebSocket connected'));
      socket.on('disconnect', () => console.log('🔌 WebSocket disconnected'));
    }).catch(() => {
      console.warn('⚠️  socket.io-client failed to load');
      socket = NOOP_SOCKET;
    });
  }
  return socket || NOOP_SOCKET;
};

export const getSocket = () => {
  if (!socket) return initSocket();
  return socket;
};
