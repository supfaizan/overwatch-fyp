/* Chat threads, one per repository.

   Held in a store rather than component state so a conversation survives
   switching side-panel tabs (the panel unmounts) and switching repositories
   (each keeps its own thread, and an answer that lands after a switch still
   goes to the thread that asked it). The answer mode is the viewer's
   preference, so it alone is remembered across reloads. */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AnswerMode, ChatMessage } from "../types";

/** Bound on one thread, so a long session cannot grow without limit. */
const MAX_MESSAGES = 100;

const EMPTY: readonly ChatMessage[] = [];

interface ChatState {
  threads: Record<string, ChatMessage[]>;
  mode: AnswerMode;
  setMode: (mode: AnswerMode) => void;
  append: (repo: string, message: ChatMessage) => void;
  markFailed: (repo: string, messageId: string) => void;
  remove: (repo: string, messageId: string) => void;
  clear: (repo: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      threads: {},
      mode: "quick",

      setMode: (mode) => set({ mode }),

      append: (repo, message) =>
        set((state) => ({
          threads: {
            ...state.threads,
            [repo]: [...(state.threads[repo] ?? []), message].slice(-MAX_MESSAGES),
          },
        })),

      markFailed: (repo, messageId) =>
        set((state) => ({
          threads: {
            ...state.threads,
            [repo]: (state.threads[repo] ?? []).map((message) =>
              message.id === messageId ? { ...message, failed: true } : message,
            ),
          },
        })),

      remove: (repo, messageId) =>
        set((state) => ({
          threads: {
            ...state.threads,
            [repo]: (state.threads[repo] ?? []).filter((message) => message.id !== messageId),
          },
        })),

      clear: (repo) =>
        set((state) => {
          const threads = { ...state.threads };
          delete threads[repo];
          return { threads };
        }),
    }),
    {
      name: "ow_chat_mode",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ mode: state.mode }),
    },
  ),
);

/** One repository's thread. A stable empty array when there is none, so the
 *  selector does not hand React a new reference on every render. */
export const useChatThread = (repo: string | null) =>
  useChatStore((state) => (repo ? (state.threads[repo] ?? EMPTY) : EMPTY));
