import {
  BracketsCurly,
  ChatsCircle,
  FileCode,
  Folder,
  FolderOpen,
  GitBranch,
  Globe,
  Package,
  Shapes,
} from '@phosphor-icons/react/ssr';
import type { NodeLabel } from '../types';

export default function NodeGlyph(
  { label, kind, open }: { label: NodeLabel; kind: string | null; open: boolean },
) {
  if (label === 'Repository') {
    return <GitBranch aria-hidden />;
  }
  if (label === 'Package' || kind === 'external') {
    return <Package aria-hidden />;
  }
  if (label === 'Route' || kind === 'routes') {
    return <Globe aria-hidden />;
  }
  if (label === 'Channel' || kind === 'channels') {
    return <ChatsCircle aria-hidden />;
  }
  if (label === 'Module') {
    return open ? <FolderOpen aria-hidden /> : <Folder aria-hidden />;
  }
  if (label === 'File') {
    return <FileCode aria-hidden />;
  }
  if (kind === 'class' || kind === 'interface') {
    return <Shapes aria-hidden />;
  }
  return <BracketsCurly aria-hidden />;
}
