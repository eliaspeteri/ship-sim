import io, { Socket } from 'socket.io-client';

const socket: typeof Socket = io(
  process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000',
);

export const connectSocket = () => {
  socket.on('connect', () => {
    console.log('Connected to the server');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from the server');
  });

  // Add more event listeners as needed
};

export const emitEvent = (event: string, data: any) => {
  socket.emit(event, data);
};

export const onEvent = (event: string, callback: (data: any) => void) => {
  socket.on(event, callback);
};

export const disconnectSocket = () => {
  socket.disconnect();
};
