import { Fragment, useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { ChatMessage, useChatStore } from '../store/chatStore';

const EMOJIS = [
  '😀','😂','😍','🥰','😎','😢','😡','🤔','😴','🤩',
  '👍','👎','👏','🙌','🤝','❤️','💔','🔥','✨','🎉',
  '😅','😇','🥺','😏','😬','🤣','😭','😱','🤗','😒',
  '🙏','💪','👀','🎵','🌟','💯','🎊','⭐','🍕','🎬',
];


interface Contact {
  userId: string;
  username: string;
  displayName: string;
  isFriend: boolean;
}

export default function ChatWidget() {
  const { user } = useAuthStore();
  const {
    widgetOpen, activeFriendId, conversations, conversationLoaded,
    unreadCounts, toggleWidget, openChat, closeChat,
    setMessages, setUnreadCounts, clearUnread, reset,
  } = useChatStore();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  const myUserId = user?.userId ?? '';
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  const activeMessages: ChatMessage[] = activeFriendId ? (conversations[activeFriendId] ?? []) : [];

  useEffect(() => {
    reset();
    setContacts([]);
  }, [user?.userId]);

  useEffect(() => {
    if (!user || !widgetOpen) return;
    const fetch = () =>
      api.get<Contact[]>('/messages/contacts').then(res => setContacts(res.data)).catch(() => {});
    fetch();
    const id = setInterval(fetch, 10000);
    return () => clearInterval(id);
  }, [widgetOpen, user?.userId]);

  useEffect(() => {
    if (!user) return;
    const fetch = () =>
      api.get<{ friendUserId: string; count: number }[]>('/messages/unread-counts')
        .then(res => setUnreadCounts(res.data))
        .catch(() => {});
    fetch();
    const id = setInterval(fetch, 5000);
    return () => clearInterval(id);
  }, [user?.userId]);

  useEffect(() => {
    if (!user || !activeFriendId) return;
    api.get<Contact[]>('/messages/contacts').then(res => setContacts(res.data)).catch(() => {});
  }, [activeFriendId, user?.userId]);

  useEffect(() => {
    if (!activeFriendId) return;

    clearUnread(activeFriendId);
    api.post(`/messages/${activeFriendId}/seen`).catch(() => {});

    const fetch = () =>
      api.get<ChatMessage[]>(`/messages/${activeFriendId}`)
        .then(res => {
          setMessages(activeFriendId, res.data);
          api.post(`/messages/${activeFriendId}/seen`).catch(() => {});
        })
        .catch(() => {});

    fetch();
    const id = setInterval(fetch, 2000);
    return () => clearInterval(id);
  }, [activeFriendId]);

  useEffect(() => {
    if (!emojiOpen) return;
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setEmojiOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [emojiOpen]);

  useEffect(() => {
    if (activeMessages.length > prevMessageCount.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessageCount.current = activeMessages.length;
  }, [activeMessages.length]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !activeFriendId || sending) return;
    setSending(true);
    setInput('');
    try {
      const { data } = await api.post<ChatMessage>(`/messages/${activeFriendId}`, { content: text });
      setMessages(activeFriendId, [...activeMessages, data]);
    } catch {
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    const el = inputRef.current;
    if (!el) { setInput(prev => prev + emoji); setEmojiOpen(false); return; }
    const start = el.selectionStart ?? input.length;
    const end = el.selectionEnd ?? input.length;
    const next = input.slice(0, start) + emoji + input.slice(end);
    setInput(next);
    setEmojiOpen(false);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const activeContact = contacts.find(c => c.userId === activeFriendId);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const sameDay = (a: string, b: string) => {
    const da = new Date(a), db = new Date(b);
    return da.getFullYear() === db.getFullYear() &&
      da.getMonth() === db.getMonth() &&
      da.getDate() === db.getDate();
  };

  const lastSentIndex = (() => {
    for (let i = activeMessages.length - 1; i >= 0; i--) {
      if (activeMessages[i].senderId === myUserId) return i;
    }
    return -1;
  })();

  if (!user) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      right: 24,
      width: 320,
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      borderRadius: '12px 12px 0 0',
      overflow: 'hidden',
      overflowX: 'hidden',
      background: 'var(--bg-surface)',
      border: '1px solid var(--bg-overlay)',
      borderBottom: 'none',
    }}>
      <button
        onClick={activeFriendId ? closeChat : toggleWidget}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          background: 'var(--bg-elevated)',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          fontWeight: 600,
          fontSize: 'var(--font-size-sm)',
          textAlign: 'left',
        }}
      >
        {activeFriendId ? (
          <>
            <span style={{ fontSize: 16 }}>←</span>
            <span style={{ flex: 1, color: 'var(--color-primary)' }}>{activeContact?.displayName ?? '...'}</span>
          </>
        ) : (
          <>
            <span style={{ flex: 1, color: 'var(--color-primary)' }}>
              Messages
              {totalUnread > 0 && (
                <span style={{
                  marginLeft: 8,
                  background: 'var(--color-primary)',
                  color: '#472552',
                  borderRadius: '999px',
                  padding: '1px 7px',
                  fontSize: 11,
                }}>{totalUnread}</span>
              )}
            </span>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              {widgetOpen ? '▼' : '▲'}
            </span>
          </>
        )}
      </button>

      {widgetOpen && (
        activeFriendId ? (
          <>
            <div style={{
              height: 340,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}>
              {activeMessages.length === 0 && (
                <p style={{
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  marginTop: 40,
                  fontSize: 'var(--font-size-sm)',
                }}>
                  No messages yet. Say hi!
                </p>
              )}
              {activeMessages.map((msg, idx) => {
                const isMine = msg.senderId === myUserId;
                const isLastSent = isMine && idx === lastSentIndex;
                const showDate = idx === 0 || !sameDay(msg.sentAt, activeMessages[idx - 1].sentAt);
                return (
                  <Fragment key={msg.id}>
                    {showDate && (
                      <div style={{
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: 11,
                        margin: '8px 0 4px',
                      }}>
                        {formatDate(msg.sentAt)}
                      </div>
                    )}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMine ? 'flex-end' : 'flex-start',
                    }}>
                      <div style={{
                        maxWidth: '80%',
                        padding: '7px 11px',
                        borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: isMine ? 'var(--color-primary)' : 'var(--bg-elevated)',
                        color: isMine ? 'var(--text-inverse)' : 'var(--text-primary)',
                        fontSize: 'var(--font-size-sm)',
                        wordBreak: 'break-word',
                      }}>
                        {msg.content}
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {formatTime(msg.sentAt)}
                        {isLastSent && ` · ${msg.seenAt ? 'Seen' : 'Delivered'}`}
                      </span>
                    </div>
                  </Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {activeContact?.isFriend ? (
              <div ref={emojiRef} style={{
                position: 'relative',
                display: 'flex',
                gap: 6,
                padding: '8px 10px',
                borderTop: '1px solid var(--bg-overlay)',
                background: 'var(--bg-surface)',
              }}>
                {emojiOpen && (
                  <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 0,
                    right: 0,
                    margin: '0 auto',
                    width: 250,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--bg-overlay)',
                    borderRadius: 10,
                    padding: 8,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 2,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                    zIndex: 10,
                    marginBottom: 4,
                  }}>
                    {EMOJIS.map(e => (
                      <button
                        key={e}
                        onClick={() => insertEmoji(e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 18,
                          padding: 2,
                          borderRadius: 4,
                          lineHeight: 1,
                        }}
                        onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--bg-overlay)')}
                        onMouseLeave={ev => (ev.currentTarget.style.background = 'none')}
                      >{e}</button>
                    ))}
                  </div>
                )}
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    fontSize: 'var(--font-size-sm)',
                    borderRadius: 20,
                    border: '1px solid var(--bg-overlay)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                  autoFocus
                />
                <button
                  onClick={() => setEmojiOpen(o => !o)}
                  title="Emoji"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 18,
                    padding: '4px 2px',
                    lineHeight: 1,
                    color: 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                >😊</button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  style={{ borderRadius: 20, padding: '6px 14px' }}
                >
                  Send
                </button>
              </div>
            ) : (
              <div style={{
                padding: '10px 14px',
                borderTop: '1px solid var(--bg-overlay)',
                background: 'var(--bg-surface)',
                textAlign: 'center',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
              }}>
                You are no longer friends, so you cannot send messages.
              </div>
            )}
          </>
        ) : (
          <div style={{ maxHeight: 320, overflowY: 'auto', overflowX: 'hidden' }}>
            {contacts.length === 0 ? (
              <p style={{
                color: 'var(--text-muted)',
                padding: '20px 14px',
                fontSize: 'var(--font-size-sm)',
                textAlign: 'center',
              }}>
                No conversations yet.
              </p>
            ) : (
              contacts.map(c => {
                const unread = unreadCounts[c.userId] ?? 0;
                return (
                  <button
                    key={c.userId}
                    onClick={() => openChat(c.userId)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      background: 'none',
                      border: 'none',
                      borderBottom: '1px solid var(--bg-overlay)',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: unread > 0 ? 700 : 400, fontSize: 'var(--font-size-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-primary)' }}>
                          {c.displayName}
                        </span>
                        {unread > 0 && (
                          <span style={{
                            flexShrink: 0,
                            background: 'var(--color-primary)',
                            color: '#472552',
                            borderRadius: '999px',
                            padding: '1px 7px',
                            fontSize: 11,
                          }}>{unread}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{c.username}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )
      )}
    </div>
  );
}
