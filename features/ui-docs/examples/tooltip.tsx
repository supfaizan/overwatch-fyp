import { Plus } from 'lucide-react';
import Button from '@/shared/components/button';
import Tooltip from '@/shared/components/tooltip';

export function IconButton() {
  return (
    <Tooltip content="New dashboard">
      <Button iconOnly aria-label="New dashboard">
        <Plus />
      </Button>
    </Tooltip>
  );
}
