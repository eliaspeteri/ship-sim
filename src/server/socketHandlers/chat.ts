import { prisma } from '../../lib/prisma';
import { socketHasPermission } from '../middleware/authorization';
import type { SocketHandlerContext } from './context';

export function registerChatHandlers({
  io,
  socket,
  spaceId,
  effectiveUserId,
  getVesselIdForUser,
  resolveChatChannel,
  normalizeVesselId,
  getActiveMute,
  loadChatHistory,
  chatHistoryPageSize,
}: SocketHandlerContext) {
  socket.on('chat:message', async data => {
    if (!socketHasPermission(socket, 'chat', 'send')) {
      socket.emit('error', 'Not authorized to send chat messages');
      return;
    }

    const mute = await getActiveMute(
      socket.data.userId,
      socket.data.username,
      spaceId,
    );
    if (mute) {
      socket.emit(
        'error',
        typeof mute.reason === 'string' && mute.reason.length > 0
          ? mute.reason
          : 'You are muted in this space',
      );
      return;
    }

    const message = typeof data.message === 'string' ? data.message.trim() : '';
    if (message.length === 0 || message.length > 500) return;

    const currentVesselId = normalizeVesselId(
      getVesselIdForUser(effectiveUserId, spaceId),
    );
    const channel = resolveChatChannel(data.channel, currentVesselId, spaceId);
    const username =
      typeof socket.data.username === 'string' &&
      socket.data.username.length > 0
        ? socket.data.username
        : 'Guest';
    const payload = {
      id: '',
      userId: effectiveUserId,
      username,
      message,
      timestamp: Date.now(),
      channel,
    };

    try {
      const row = await prisma.chatMessage.create({
        data: {
          userId: payload.userId,
          username: payload.username,
          message: payload.message,
          spaceId,
          channel: payload.channel,
        },
      });
      payload.id = row.id;
      payload.timestamp = row.createdAt.getTime();
    } catch (err) {
      console.warn('Failed to persist chat message', err);
    }

    const room = channel.startsWith('space:')
      ? channel
      : `space:${spaceId}:global`;
    io.to(room).emit('chat:message', payload);
  });

  socket.on('chat:history', async data => {
    const currentVesselId = normalizeVesselId(
      getVesselIdForUser(effectiveUserId, spaceId),
    );
    const channel = resolveChatChannel(data.channel, currentVesselId, spaceId);
    const before = typeof data.before === 'number' ? data.before : undefined;
    const limit =
      typeof data.limit === 'number' && !Number.isNaN(data.limit)
        ? Math.min(Math.max(Math.floor(data.limit), 1), 50)
        : chatHistoryPageSize;
    try {
      console.info(
        `Loading chat history for channel ${channel} before ${before} limit ${limit}`,
      );
      const { messages, hasMore } = await loadChatHistory(
        channel,
        before,
        limit,
      );
      socket.emit('chat:history', {
        channel,
        messages,
        hasMore,
        reset: before === undefined,
      });
    } catch (err) {
      console.warn('Failed to load chat history', err);
      socket.emit('chat:history', {
        channel,
        messages: [],
        hasMore: false,
        reset: before === undefined,
      });
    }
  });
}
