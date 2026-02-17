import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { socketManager } from '../networking/socket';
import useStore from '../store';

interface ChatPanelProps {
  spaceId: string;
  vesselChannel?: string | null;
}

const ui = {
  panel:
    'rounded-[18px] border border-[rgba(27,154,170,0.35)] bg-[rgba(10,20,34,0.85)] p-[14px] shadow-[0_18px_40px_rgba(2,8,18,0.45)]',
  title: 'text-[11px] uppercase tracking-[0.2em] text-[rgba(160,179,192,0.7)]',
  list: 'mt-2.5 max-h-[220px] overflow-y-auto rounded-xl border border-[rgba(23,44,68,0.6)] bg-[rgba(6,12,18,0.6)] p-2.5',
  messageRow:
    'flex items-start gap-2.5 text-[13px] text-[rgba(226,236,240,0.9)] [&+&]:mt-2',
  channelBadge:
    'rounded-full bg-[rgba(50,70,90,0.6)] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-[rgba(230,238,240,0.85)]',
  sender: 'font-semibold text-[rgba(238,246,248,0.96)]',
  emptyState: 'text-xs text-[rgba(170,186,196,0.7)]',
  inputRow:
    'mt-2.5 grid grid-cols-[150px_1fr_auto] gap-2 max-[720px]:grid-cols-1',
  select:
    'rounded-[10px] border border-[rgba(40,60,80,0.6)] bg-[rgba(12,24,38,0.9)] px-2 py-1.5 text-xs text-[rgba(230,238,240,0.9)]',
  input:
    'rounded-[10px] border border-[rgba(40,60,80,0.6)] bg-[rgba(10,20,34,0.9)] px-2.5 py-1.5 text-[13px] text-[rgba(230,238,240,0.95)] focus:border-[rgba(27,154,170,0.7)] focus:outline-none focus:ring-2 focus:ring-[rgba(27,154,170,0.2)]',
  sendButton:
    'rounded-[10px] border-none bg-[linear-gradient(135deg,#1b9aaa,#0c6670)] px-4 py-1.5 text-xs font-semibold text-[#f5fbfc] transition-[transform,box-shadow] duration-200 hover:enabled:-translate-y-px hover:enabled:shadow-[0_8px_20px_rgba(12,80,90,0.35)] disabled:cursor-not-allowed disabled:opacity-50',
  disabledHint: 'mt-2 text-[11px] text-[rgba(150,170,180,0.6)]',
} as const;

export const ChatPanel: React.FC<ChatPanelProps> = ({
  spaceId,
  vesselChannel,
}) => {
  const chatMessages = useStore(state => state.chatMessages);
  const chatHistoryMeta = useStore(state => state.chatHistoryMeta);
  const roles = useStore(state => state.roles);
  const [chatChannel, setChatChannel] = useState<string>(
    `space:${spaceId}:global`,
  );
  const [chatInput, setChatInput] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const canChat = roles.includes('player') || roles.includes('admin');

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

  const loadOlderChat = useCallback(() => {
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
  }, [chatHistoryMeta, channelsOfInterest, earliestByChannel, loadingHistory]);

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
    if (!canChat) return;
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
    <div className={ui.panel}>
      <div className={ui.title}>Chat</div>
      <div ref={chatListRef} className={ui.list}>
        {chatLoaded ? (
          mergedChatMessages.length === 0 ? (
            <div className={ui.emptyState}>No messages yet</div>
          ) : (
            mergedChatMessages.map((msg, idx) => (
              <div
                key={`${msg.id || msg.timestamp}-${idx}`}
                className={ui.messageRow}
              >
                <span className={ui.channelBadge}>
                  {channelLabel(msg.channel)}
                </span>
                <div>
                  <span className={ui.sender}>
                    {msg.username || msg.userId}:
                  </span>{' '}
                  {msg.message}
                </div>
              </div>
            ))
          )
        ) : (
          <div className={ui.emptyState}>Loading chat...</div>
        )}
      </div>
      <div className={ui.inputRow}>
        <select
          className={ui.select}
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
          className={ui.input}
          placeholder="Message..."
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          disabled={!canChat}
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
          disabled={!canChat}
          className={ui.sendButton}
        >
          Send
        </button>
      </div>
      {!canChat ? (
        <div className={ui.disabledHint}>
          Spectators cannot send chat in this space.
        </div>
      ) : null}
    </div>
  );
};
