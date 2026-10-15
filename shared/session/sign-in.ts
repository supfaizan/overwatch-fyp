import { api } from '@/shared/api/client';
import { type User, useSession } from './store';

/** Start the session from an access token the API just issued (its refresh cookie came with it). */
export async function startSession(token: string): Promise<User> {
  useSession.getState().setToken(token);
  const user = await api.get<User>('/me');
  useSession.getState().setUser(user);
  return user;
}
