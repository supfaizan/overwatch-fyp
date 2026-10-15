import { z } from 'zod';
import { EMAIL_MAX_LENGTH, NAME_MAX_LENGTH, OTP_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, USERNAME_MESSAGES, USERNAME_PATTERN } from './constants';

// first checks in the browser; the backend applies the same rules (and a breach check) again
const email = z.string().trim().min(1, 'Enter your email').email('Enter a valid email address').max(EMAIL_MAX_LENGTH, 'That email is too long');
const newPassword = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Use at most ${PASSWORD_MAX_LENGTH} characters`);
export const username = z.string().trim().toLowerCase().regex(USERNAME_PATTERN, USERNAME_MESSAGES.invalid);
const name = z.string().trim().min(1, 'Enter your name').max(NAME_MAX_LENGTH, `Use at most ${NAME_MAX_LENGTH} characters`);

export const signInSchema = z.object({ email, password: z.string().min(1, 'Enter your password') });
export const signUpSchema = z.object({ name, username, email, password: newPassword });
export const inviteSignUpSchema = z.object({ name, username, password: newPassword });
export const forgotPasswordSchema = z.object({ email });
export const resetPasswordSchema = z
  .object({ password: newPassword, confirm: z.string() })
  .refine((values) => values.password === values.confirm, { message: "Passwords don't match", path: ['confirm'] });
export const usernameSchema = z.object({ username });
export const codeSchema = z.string().regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), `Enter the ${OTP_LENGTH}-digit code`);

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type InviteSignUpValues = z.infer<typeof inviteSignUpSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type UsernameValues = z.infer<typeof usernameSchema>;
