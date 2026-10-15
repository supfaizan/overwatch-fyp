'use client';

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/shared/components/input-otp';
import { OTP_LENGTH } from '../constants';

const HALF = OTP_LENGTH / 2;
const SLOTS = Array.from({ length: OTP_LENGTH }, (_, index) => index);

/** The emailed six-digit code, as 123–456; submits itself once complete. */
export default function CodeInput({
  value,
  onChange,
  onComplete,
  invalid,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onComplete: (code: string) => void;
  invalid?: boolean;
  disabled?: boolean;
}) {
  return (
    <InputOTP
      id="code"
      maxLength={OTP_LENGTH}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      disabled={disabled}
      autoFocus
      aria-label="Verification code"
      aria-invalid={invalid}
      aria-describedby={invalid ? 'code-error' : undefined}
      containerClassName="justify-center"
    >
      <InputOTPGroup>
        {SLOTS.slice(0, HALF).map((index) => <InputOTPSlot key={index} index={index} />)}
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        {SLOTS.slice(HALF).map((index) => <InputOTPSlot key={index} index={index} />)}
      </InputOTPGroup>
    </InputOTP>
  );
}
