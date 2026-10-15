import Button from '@/shared/components/button';
import Tooltip from '@/shared/components/tooltip';
import { Plus } from '@phosphor-icons/react/ssr';

export function IconButton() {
  return (
    <Tooltip content="New dashboard">
      <Button iconOnly aria-label="New dashboard">
        <Plus />
      </Button>
    </Tooltip>
  );
}
