import { api } from '@/shared/api/client';
import { endSession } from './refresh';

/** Sign out here (or on every device). Local state is cleared even if the request fails. */
export async function signOut({ everywhere = false } = {}): Promise<void> {
  try {
    await api.post<null>(everywhere ? '/auth/logout-all' : '/auth/logout');
  } finally {
    endSession();
  }
}
