import { ChatHistoryResponse, ChatMessageData } from '../../types/socket.types';

export type NormalizedChatHistory = {
  channel: string;
  messages: ChatMessageData[];
  reset: boolean;
  hasMore?: boolean;
};

export const normalizeVesselHistoryChannel = (channel: string): string => {
  if (channel && channel.startsWith('vessel:')) {
    return `vessel:${channel.split(':')[1]?.split('_')[0] || ''}`;
  }
  return channel;
};

export const normalizeChatMessage = (
  message: ChatMessageData,
  fallbackChannel: string,
  now = Date.now,
): ChatMessageData => ({
  id: message.id,
  userId: message.userId,
  username: message.username,
  message: message.message,
  timestamp: message.timestamp || now(),
  channel: message.channel || fallbackChannel,
});

export const normalizeChatHistoryPayload = (
  data: ChatHistoryResponse,
  now = Date.now,
): NormalizedChatHistory => {
  const incomingChannel = data?.channel || 'global';
  const channel = normalizeVesselHistoryChannel(incomingChannel);
  const messages = Array.isArray(data?.messages)
    ? data.messages.map(message => normalizeChatMessage(message, channel, now))
    : [];

  return {
    channel,
    messages,
    reset: Boolean(data?.reset),
    hasMore: data?.hasMore,
  };
};
