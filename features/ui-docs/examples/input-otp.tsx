'use client';

import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/shared/components/input-otp';

const SLOTS = [0, 1, 2, 3, 4, 5];

export function SixDigits() {
  return (
    <InputOTP maxLength={6} aria-label="Verification code">
      <InputOTPGroup>
        {SLOTS.map((index) => (
          <InputOTPSlot key={index} index={index} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}

export function Grouped() {
  return (
    <InputOTP maxLength={6} aria-label="Verification code">
      <InputOTPGroup>
        {SLOTS.slice(0, 3).map((index) => (
          <InputOTPSlot key={index} index={index} />
        ))}
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        {SLOTS.slice(3).map((index) => (
          <InputOTPSlot key={index} index={index} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}

export function Invalid() {
  return (
    <div className="flex flex-col gap-1.5">
      <InputOTP maxLength={6} defaultValue="123456" aria-label="Verification code" aria-invalid aria-describedby="otp-error">
        <InputOTPGroup>
          {SLOTS.map((index) => (
            <InputOTPSlot key={index} index={index} />
          ))}
        </InputOTPGroup>
      </InputOTP>
      <p id="otp-error" className="text-xs text-danger">
        That code is incorrect or has expired.
      </p>
    </div>
  );
}

export function Disabled() {
  return (
    <InputOTP maxLength={6} disabled aria-label="Verification code">
      <InputOTPGroup>
        {SLOTS.map((index) => (
          <InputOTPSlot key={index} index={index} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
