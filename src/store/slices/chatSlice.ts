import type { ChatMessageData } from '../../types/socket.types';
import type { SimulationState, StoreSet } from '../types';

const normalizeChannel = (channel?: string): string => {
  const raw = channel || 'global';
  if (raw.startsWith('space:')) {
    const parts = raw.split(':');
    const spaceId = parts[1] || 'global';
    const remainder = parts.slice(2).join(':') || 'global';
    if (remainder.startsWith('vessel:')) {
      const [, rest] = remainder.split(':');
      const [id] = rest.split('_');
      return `space:${spaceId}:vessel:${id}`;
    }
    return `space:${spaceId}:${remainder || 'global'}`;
  }
  if (raw.startsWith('vessel:')) {
    const [, rest] = raw.split(':');
    const [id] = rest.split('_');
    return `vessel:${id}`;
  }
  return raw;
};

const normalizeChatMessage = (message: ChatMessageData): ChatMessageData => ({
  ...message,
  timestamp: message.timestamp ?? Date.now(),
  channel: normalizeChannel(message.channel),
});

const mergeChatMessages = (
  existing: ChatMessageData[],
  incoming: ChatMessageData[],
  maxMessages = 200,
): ChatMessageData[] => {
  const merged = new Map<string, ChatMessageData>();
  [...existing, ...incoming].forEach(message => {
    const normalized = normalizeChatMessage(message);
    const key =
      normalized.id ||
      `${normalized.channel}|${normalized.timestamp}|${normalized.userId}|${normalized.message}`;
    if (!merged.has(key)) {
      merged.set(key, normalized);
    }
  });

  return Array.from(merged.values())
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-maxMessages);
};

type ChatSlice = Pick<
  SimulationState,
  | 'chatMessages'
  | 'chatHistoryMeta'
  | 'addChatMessage'
  | 'setChatMessages'
  | 'mergeChatMessages'
  | 'replaceChannelMessages'
  | 'setChatHistoryMeta'
>;

export const createChatSlice = (set: StoreSet): ChatSlice => ({
  chatMessages: [],
  chatHistoryMeta: {},
  addChatMessage: message =>
    set(state => ({
      chatMessages: mergeChatMessages(state.chatMessages, [message]),
    })),
  setChatMessages: messages =>
    set({
      chatMessages: mergeChatMessages([], messages),
    }),
  mergeChatMessages: messages =>
    set(state => ({
      chatMessages: mergeChatMessages(state.chatMessages, messages),
    })),
  replaceChannelMessages: (channel, messages) =>
    set(state => {
      const normalizedChannel = normalizeChannel(channel);
      const retained = state.chatMessages.filter(
        message => normalizeChannel(message.channel) !== normalizedChannel,
      );
      return {
        chatMessages: mergeChatMessages(retained, messages),
      };
    }),
  setChatHistoryMeta: (channel, meta) =>
    set(state => ({
      chatHistoryMeta: {
        ...state.chatHistoryMeta,
        [channel]: {
          hasMore: meta.hasMore,
          loaded:
            meta.loaded ?? state.chatHistoryMeta[channel]?.loaded ?? false,
        },
      },
    })),
});
