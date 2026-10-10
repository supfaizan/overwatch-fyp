import { Plus, Trash } from '@phosphor-icons/react/ssr';
import Button from '@/shared/components/button';

export function Variants() {
  return (
    <>
      <Button variant="primary">Create dashboard</Button>
      <Button>Share</Button>
      <Button variant="tertiary">Cancel</Button>
      <Button variant="danger">Delete dashboard</Button>
    </>
  );
}

export function Sizes() {
  return (
    <>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </>
  );
}

export function WithIcon() {
  return (
    <>
      <Button variant="primary">
        <Plus />
        New dashboard
      </Button>
      <Button iconOnly aria-label="Delete">
        <Trash />
      </Button>
    </>
  );
}

export function States() {
  return (
    <>
      <Button variant="primary" loading>
        Saving
      </Button>
      <Button disabled>Disabled</Button>
      <Button raised={false}>Flat</Button>
    </>
  );
}

export function ColorOverrides() {
  return (
    <>
      <Button variant="primary" bg="var(--color-danger)" border="#9e2804" edge="#9e2804">
        Delete repository
      </Button>
      <Button variant="primary" bg="#e9a23b" border="#9a6516" edge="#9a6516" text="#111">
        Upgrade
      </Button>
    </>
  );
}
