// mirrors the backend's rules (app/auth/passwords.py, usernames.py, otp.py) and AuthErrorCode

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9]|[-_](?=[a-z0-9])){2,29}$/;
export const NAME_MAX_LENGTH = 80;
export const EMAIL_MAX_LENGTH = 254;
export const OTP_LENGTH = 6;
export const OTP_TTL_MINUTES = 10;
export const PASSWORD_HINT = `At least ${PASSWORD_MIN_LENGTH} characters. A few unrelated words make a strong one.`;

export const AUTH_ERROR = {
  emailNotVerified: 'email_not_verified',
  invalidCode: 'invalid_code',
  otpAttemptsExceeded: 'otp_attempts_exceeded',
  otpResendCooldown: 'otp_resend_cooldown',
  usernameAlreadySet: 'username_already_set',
} as const;

export const CHALLENGE_PURPOSE = { verifyEmail: 'verify_email', resetPassword: 'reset_password' } as const;
export type ChallengePurpose = (typeof CHALLENGE_PURPOSE)[keyof typeof CHALLENGE_PURPOSE];

export const USERNAME_PROBLEM = { invalid: 'invalid', reserved: 'reserved', taken: 'taken' } as const;
export type UsernameProblem = (typeof USERNAME_PROBLEM)[keyof typeof USERNAME_PROBLEM];

export const USERNAME_MESSAGES: Record<UsernameProblem, string> = {
  invalid: `Use ${USERNAME_MIN_LENGTH}–${USERNAME_MAX_LENGTH} lowercase letters, numbers, - or _`,
  reserved: "That username isn't available",
  taken: 'That username is taken',
};
