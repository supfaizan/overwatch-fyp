import { ChatCircle, FolderOpen, SquaresFour } from '@phosphor-icons/react/ssr';
import SegmentedButton from '@/shared/components/segmented-button';

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
