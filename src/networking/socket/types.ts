import type io from 'socket.io-client';
import type * as SocketIOClient from 'socket.io-client';

export type ClientSocket = ReturnType<typeof io> & {
  auth?: {
    token?: string | null;
    userId?: string | null;
    username?: string | null;
    spaceId?: string | null;
    mode?: 'player' | 'spectator';
    autoJoin?: boolean;
  };
};

export type ClientConnectOpts = Partial<SocketIOClient.ConnectOpts> & {
  withCredentials?: boolean;
  auth?: {
    userId?: string | null;
    username?: string | null;
    token?: string | null;
    spaceId?: string | null;
    mode?: 'player' | 'spectator';
    autoJoin?: boolean;
  };
};

export const CHAT_HISTORY_PAGE_SIZE = 20;
export const RESYNC_POLL_MS = 2000;
export const RESYNC_STALE_MS = 8000;
