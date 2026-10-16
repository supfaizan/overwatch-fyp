import { api } from '@/shared/api/client';
import type { WaitlistValues } from './schemas';

/** `already_joined`: the email was on the list before, so nothing changed and no email went out. */
export type WaitlistJoined = { already_joined: boolean };

export function joinWaitlist(values: WaitlistValues) {
  return api.post<WaitlistJoined>('/waitlist', values);
}
