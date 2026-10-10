import type { ComponentType } from 'react';
import * as banner from './banner';
import * as button from './button';
import * as card from './card';
import * as checkbox from './checkbox';
import * as dialog from './dialog';
import * as dropdownMenu from './dropdown-menu';
import * as input from './input';
import * as kbd from './kbd';
import * as segmentedButton from './segmented-button';
import * as skeleton from './skeleton';
import * as spinner from './spinner';
import * as switchExamples from './switch';
import * as tag from './tag';
import * as toaster from './toaster';
import * as tooltip from './tooltip';

// keyed by the shared/components file name; one file per component, each export is one example
export const examples: Record<string, Record<string, ComponentType>> = {
  banner,
  button,
  card,
  checkbox,
  dialog,
  'dropdown-menu': dropdownMenu,
  input,
  kbd,
  'segmented-button': segmentedButton,
  skeleton,
  spinner,
  switch: switchExamples,
  tag,
  toaster,
  tooltip,
};
