import { api } from '@/shared/api/client';
import type { WaitlistValues } from './schemas';

/** Accepted the same way whether or not the email was already on the list. */
export function joinWaitlist(values: WaitlistValues) {
  return api.post<null>('/waitlist', values);
}
