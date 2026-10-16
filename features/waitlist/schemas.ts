import { z } from 'zod';
import { EMAIL_MAX_LENGTH, HEARD_FROM, NAME_MAX_LENGTH } from './constants';

// first checks in the browser; the backend applies the same rules again
export const waitlistSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(
    NAME_MAX_LENGTH,
    `Use at most ${NAME_MAX_LENGTH} characters`,
  ),
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address').max(
    EMAIL_MAX_LENGTH,
    'That email is too long',
  ),
  heard_from: z.enum(HEARD_FROM, { message: 'Pick one' }),
});

export type WaitlistValues = z.infer<typeof waitlistSchema>;
