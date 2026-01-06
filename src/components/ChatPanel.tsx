import React, { useEffect, useMemo, useRef, useState } from 'react';
import useStore from '../store';
import socketManager from '../networking/socket';

interface ChatPanelProps {
  spaceId: string;
  vesselChannel?: string | null;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  spaceId,
  vesselChannel,
}) => {
  const chatMessages = useStore(state => state.chatMessages);
  const chatHistoryMeta = useStore(state => state.chatHistoryMeta);
  const [chatChannel, setChatChannel] = useState<string>(
    `space:${spaceId}:global`,
  );
  const [chatInput, setChatInput] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    setChatChannel(`space:${spaceId}:global`);
  }, [spaceId]);

  // Request history for the primary channels when channel changes
  useEffect(() => {
    socketManager.requestChatHistory(chatChannel);
    if (vesselChannel) {
      socketManager.requestChatHistory(`space:${spaceId}:${vesselChannel}`);
    }
  }, [chatChannel, spaceId, vesselChannel]);

  const mergedChatMessages = useMemo(() => {
    return [...chatMessages].sort((a, b) => a.timestamp - b.timestamp);
  }, [chatMessages]);

  const channelsOfInterest = useMemo(() => {
    const list = [`space:${spaceId}:global`];
    if (vesselChannel) list.push(`space:${spaceId}:${vesselChannel}`);
    return list;
  }, [spaceId, vesselChannel]);

  const earliestByChannel = useMemo(() => {
    const map = new Map<string, number>();
    mergedChatMessages.forEach(msg => {
      const chan = msg.channel || 'global';
      if (!channelsOfInterest.includes(chan)) return;
      const existing = map.get(chan);
      if (!existing || msg.timestamp < existing) {
        map.set(chan, msg.timestamp);
      }
    });
    return map;
  }, [mergedChatMessages, channelsOfInterest]);

  const loadOlderChat = () => {
    if (loadingHistory) return;
    setLoadingHistory(true);
    channelsOfInterest.forEach(chan => {
      const before = earliestByChannel.get(chan);
      const hasMore = chatHistoryMeta[chan]?.hasMore ?? true;
      if (hasMore) {
        socketManager.requestChatHistory(chan, before);
      }
    });
    setTimeout(() => setLoadingHistory(false), 250);
  };

  const chatListRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = chatListRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop < 24) loadOlderChat();
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [loadOlderChat]);

  const sendChat = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    socketManager.sendChatMessage(trimmed, chatChannel);
    setChatInput('');
  };

  const channelLabel = (chan?: string) => {
    const c = chan || `space:${spaceId}:global`;
    if (vesselChannel && c.endsWith(vesselChannel)) return 'Vessel';
    if (c.includes(':global')) return 'Space';
    return 'Global';
  };

  const chatLoaded =
    chatHistoryMeta[chatChannel]?.loaded ?? mergedChatMessages.length > 0;

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/80 p-3 text-white shadow-lg">
      <div className="text-gray-400 text-xs">Chat</div>
      <div
        ref={chatListRef}
        className="mt-2 max-h-48 overflow-y-auto space-y-2 rounded bg-gray-950/60 p-2"
      >
        {chatLoaded ? (
          mergedChatMessages.length === 0 ? (
            <div className="text-xs text-gray-400">No messages yet</div>
          ) : (
            mergedChatMessages.map((msg, idx) => (
              <div
                key={`${msg.id || msg.timestamp}-${idx}`}
                className="flex items-start gap-2 text-sm text-gray-200"
              >
                <span className="mt-[2px] rounded-full bg-gray-800 px-2 py-[2px] text-[10px] uppercase text-gray-100">
                  {channelLabel(msg.channel)}
                </span>
                <div>
                  <span className="font-semibold text-gray-100">
                    {msg.username || msg.userId}:
                  </span>{' '}
                  {msg.message}
                </div>
              </div>
            ))
          )
        ) : (
          <div className="text-xs text-gray-400">Loading chat...</div>
        )}
      </div>
      <div className="mt-2 flex items-center space-x-2">
        <select
          className="rounded bg-gray-800 px-2 py-1 text-xs text-white"
          value={chatChannel}
          onChange={e => setChatChannel(e.target.value)}
        >
          <option value={`space:${spaceId}:global`}>This space</option>
          {vesselChannel ? (
            <option value={`space:${spaceId}:${vesselChannel}`}>
              This vessel
            </option>
          ) : null}
        </select>
        <input
          className="flex-1 rounded bg-gray-800 px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Message..."
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              sendChat();
            }
          }}
        />
        <button
          type="button"
          onClick={sendChat}
          className="rounded bg-blue-600 px-3 py-1 text-sm font-semibold hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
};
