import Cookies from 'js-cookie';
import { create } from 'zustand';
import { SESSION_HINT_COOKIE } from './constants';

export type User = {
  id: string;
  /** null only until an account from before usernames chooses one */
  username: string | null;
  email: string | null;
  /** null until GitHub is connected */
  github_login: string | null;
  name: string | null;
  avatar_url: string | null;
};

type SessionState = {
  /** `loading` until the first refresh attempt settles. */
  status: 'loading' | 'authenticated' | 'guest';
  /** Short-lived access token, kept in memory only (never in storage, so XSS can't lift it later). */
  token: string | null;
  user: User | null;
  setToken: (token: string) => void;
  /** Another user's token: back to `loading` until their profile arrives, so nothing renders with the old user. */
  switchTo: (token: string) => void;
  setUser: (user: User) => void;
  clear: () => void;
};

export const useSession = create<SessionState>()((set) => {
  return {
    status: 'loading',
    token: null,
    user: null,
    setToken: (token) => {
      Cookies.set(SESSION_HINT_COOKIE, '1', { expires: 30, sameSite: 'lax', path: '/' });
      set({ token });
    },
    switchTo: (token) => {
      Cookies.set(SESSION_HINT_COOKIE, '1', { expires: 30, sameSite: 'lax', path: '/' });
      set({ token, user: null, status: 'loading' });
    },
    setUser: (user) => {
      return set({ user, status: 'authenticated' });
    },
    clear: () => {
      Cookies.remove(SESSION_HINT_COOKIE, { path: '/' });
      set({ token: null, user: null, status: 'guest' });
    },
  };
});
