import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

let socket = null;

export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ['websocket'] });
    socket.on('connect', () => console.log('🔗 WebSocket connected'));
    socket.on('disconnect', () => console.log('🔌 WebSocket disconnected'));
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) return initSocket();
  return socket;
};
