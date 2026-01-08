import React, { useEffect, useMemo, useRef, useState } from 'react';
import useStore from '../store';
import socketManager from '../networking/socket';
import styles from './ChatPanel.module.css';

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
    <div className={styles.panel}>
      <div className={styles.title}>Chat</div>
      <div ref={chatListRef} className={styles.list}>
        {chatLoaded ? (
          mergedChatMessages.length === 0 ? (
            <div className={styles.emptyState}>No messages yet</div>
          ) : (
            mergedChatMessages.map((msg, idx) => (
              <div
                key={`${msg.id || msg.timestamp}-${idx}`}
                className={styles.messageRow}
              >
                <span className={styles.channelBadge}>
                  {channelLabel(msg.channel)}
                </span>
                <div>
                  <span className={styles.sender}>
                    {msg.username || msg.userId}:
                  </span>{' '}
                  {msg.message}
                </div>
              </div>
            ))
          )
        ) : (
          <div className={styles.emptyState}>Loading chat...</div>
        )}
      </div>
      <div className={styles.inputRow}>
        <select
          className={styles.select}
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
          className={styles.input}
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
          className={styles.sendButton}
        >
          Send
        </button>
      </div>
      {!canChat ? (
        <div className={styles.disabledHint}>
          Spectators cannot send chat in this space.
        </div>
      ) : null}
    </div>
  );
};
