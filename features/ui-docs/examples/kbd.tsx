import Kbd from '@/shared/components/kbd';

export function Shortcuts() {
  return (
    <>
      <Kbd>⌘K</Kbd>
      <span className="text-sm text-muted">
        Press <Kbd>Esc</Kbd> to close
      </span>
    </>
  );
}
