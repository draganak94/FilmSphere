import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  sentAt: string;
  seenAt: string | null;
}

interface ChatState {
  widgetOpen: boolean;
  activeFriendId: string | null;
  conversations: Record<string, ChatMessage[]>;
  conversationLoaded: Record<string, boolean>;
  unreadCounts: Record<string, number>;

  toggleWidget: () => void;
  openChat: (friendId: string) => void;
  closeChat: () => void;
  setMessages: (friendId: string, messages: ChatMessage[]) => void;
  setUnreadCounts: (counts: { friendUserId: string; count: number }[]) => void;
  clearUnread: (friendId: string) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  widgetOpen: false,
  activeFriendId: null,
  conversations: {},
  conversationLoaded: {},
  unreadCounts: {},

  toggleWidget: () => set(s => ({ widgetOpen: !s.widgetOpen })),

  openChat: (friendId) => set({ activeFriendId: friendId, widgetOpen: true }),

  closeChat: () => set({ activeFriendId: null }),

  setMessages: (friendId, messages) =>
    set(s => ({
      conversations: { ...s.conversations, [friendId]: messages },
      conversationLoaded: { ...s.conversationLoaded, [friendId]: true },
    })),

  setUnreadCounts: (counts) => {
    const map: Record<string, number> = {};
    counts.forEach(c => { map[c.friendUserId] = c.count; });
    set({ unreadCounts: map });
  },

  clearUnread: (friendId) =>
    set(s => {
      const next = { ...s.unreadCounts };
      delete next[friendId];
      return { unreadCounts: next };
    }),

  reset: () => set({
    widgetOpen: false,
    activeFriendId: null,
    conversations: {},
    conversationLoaded: {},
    unreadCounts: {},
  }),
}));
