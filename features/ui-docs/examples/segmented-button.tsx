import { FolderOpen, LayoutGrid, MessageSquare } from 'lucide-react';
import SegmentedButton from '@/shared/components/segmented-button';

export function Views() {
  return (
    <SegmentedButton
      aria-label="Sidebar view"
      options={[
        { value: 'apps', label: 'Apps', icon: <LayoutGrid /> },
        { value: 'files', label: 'Files', icon: <FolderOpen /> },
        { value: 'chat', label: 'Chat', icon: <MessageSquare /> },
      ]}
    />
  );
}
