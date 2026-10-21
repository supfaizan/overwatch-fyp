'use client';

import Card from '@/shared/components/card';
import Kbd from '@/shared/components/kbd';
import SegmentedButton from '@/shared/components/segmented-button';
import { Monitor, Moon, Sun } from '@phosphor-icons/react/ssr';
import { useTheme } from 'next-themes';
import type { ReactNode } from 'react';
import { SettingsSection } from './settings-layout';

type Theme = 'light' | 'dark' | 'system';

const THEMES: { value: Theme; label: string; icon: ReactNode }[] = [
  { value: 'light', label: 'Light', icon: <Sun /> },
  { value: 'dark', label: 'Dark', icon: <Moon /> },
  { value: 'system', label: 'System', icon: <Monitor /> },
];

const isTheme = (value: string | undefined): value is Theme => {
  return THEMES.some((theme) => {
    return theme.value === value;
  });
};

export default function PreferencesSection() {
  const { theme, setTheme } = useTheme();
  const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent);

  return (
    <SettingsSection
      title="Preferences"
      description="How the app looks and works for you on this device."
    >
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Theme</p>
          <p className="text-sm text-muted">System follows your device&apos;s setting.</p>
        </div>
        <SegmentedButton
          aria-label="Theme"
          options={THEMES}
          value={isTheme(theme) ? theme : 'system'}
          onValueChange={setTheme}
        />
      </Card>
      <Card className="flex flex-col gap-3">
        <p className="text-sm font-medium">Keyboard shortcuts</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Open the command menu</span>
          <Kbd>{isMac ? '⌘K' : 'Ctrl K'}</Kbd>
        </div>
      </Card>
    </SettingsSection>
  );
}
