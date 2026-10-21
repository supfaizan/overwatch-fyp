'use client';

import RadioGroup from '@/shared/components/radio-group';
import { useState } from 'react';

const SIZES = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
] as const;

export function Basic() {
  const [size, setSize] = useState<(typeof SIZES)[number]['value']>('medium');
  return <RadioGroup aria-label="Size" options={SIZES} value={size} onValueChange={setSize} />;
}
