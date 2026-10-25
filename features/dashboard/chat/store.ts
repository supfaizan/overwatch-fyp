import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ChatSessionState = {
  /** the conversation open in the chat, per `conversationKey` */
  current: Record<string, string>;
  setCurrent: (key: string, id: string | null) => void;
};

/** Whose chat on which repo: a conversation belongs to one person in one workspace. */
export const conversationKey = (userId: string, workspaceId: string, repo: string) => {
  return `${userId}:${workspaceId}:${repo}`;
};

/**
 * The conversation each repo's chat is on, so closing and reopening the chat, or reloading, returns
 * to it. Kept for this tab only: a new tab starts a new conversation, and nothing of a private chat
 * outlives the browser session.
 */
export const useChatSession = create<ChatSessionState>()(
  persist(
    (set) => {
      return {
        current: {},
        setCurrent: (key, id) => {
          return set((state) => {
            const { [key]: _, ...rest } = state.current;
            return { current: id ? { ...rest, [key]: id } : rest };
          });
        },
      };
    },
    {
      name: 'overwatch:chat-conversations',
      storage: createJSONStorage(() => {
        return sessionStorage;
      }),
    },
  ),
);
