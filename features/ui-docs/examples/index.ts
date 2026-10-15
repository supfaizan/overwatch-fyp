import type { ComponentType } from 'react';
import * as avatar from './avatar';
import * as banner from './banner';
import * as button from './button';
import * as card from './card';
import * as checkbox from './checkbox';
import * as command from './command';
import * as confirmDialog from './confirm-dialog';
import * as contextMenu from './context-menu';
import * as dialog from './dialog';
import * as dropdownMenu from './dropdown-menu';
import * as githubMark from './github-mark';
import * as input from './input';
import * as inputOtp from './input-otp';
import * as kbd from './kbd';
import * as markdown from './markdown';
import * as repoPicker from './repo-picker';
import * as richTextEditor from './rich-text-editor';
import * as segmentedButton from './segmented-button';
import * as select from './select';
import * as skeleton from './skeleton';
import * as spinner from './spinner';
import * as statusTag from './status-tag';
import * as steps from './steps';
import * as switchExamples from './switch';
import * as tag from './tag';
import * as toaster from './toaster';
import * as tooltip from './tooltip';

// keyed by the shared/components file name; one file per component, each export is one example
export const examples: Record<string, Record<string, ComponentType>> = {
  avatar,
  banner,
  button,
  card,
  checkbox,
  command,
  'confirm-dialog': confirmDialog,
  'context-menu': contextMenu,
  dialog,
  'dropdown-menu': dropdownMenu,
  'github-mark': githubMark,
  input,
  'input-otp': inputOtp,
  kbd,
  markdown,
  'repo-picker': repoPicker,
  'rich-text-editor': richTextEditor,
  'segmented-button': segmentedButton,
  select,
  skeleton,
  spinner,
  'status-tag': statusTag,
  steps,
  switch: switchExamples,
  tag,
  toaster,
  tooltip,
};
