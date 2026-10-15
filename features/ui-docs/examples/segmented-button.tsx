import SegmentedButton from '@/shared/components/segmented-button';
import { ChatCircle, FolderOpen, SquaresFour } from '@phosphor-icons/react/ssr';

export function Views() {
  return (
    <SegmentedButton
      aria-label="Sidebar view"
      options={[
        { value: 'apps', label: 'Apps', icon: <SquaresFour /> },
        { value: 'files', label: 'Files', icon: <FolderOpen /> },
        { value: 'chat', label: 'Chat', icon: <ChatCircle /> },
      ]}
    />
  );
}

export function Small() {
  return (
    <SegmentedButton
      size="sm"
      aria-label="Board view"
      options={[
        { value: 'board', label: 'Board' },
        { value: 'backlog', label: 'Backlog' },
      ]}
    />
  );
}
