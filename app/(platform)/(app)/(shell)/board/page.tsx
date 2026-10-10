import { Kanban } from '@phosphor-icons/react/ssr';

// placeholder until the board step
const page = () => (
  <main className="flex h-full flex-col items-center justify-center gap-2 text-center">
    <Kanban className="size-6 text-muted" aria-hidden />
    <h1 className="text-lg font-bold">Board</h1>
    <p className="max-w-sm text-sm text-muted">Your tracker&apos;s tickets, and tasks created here, will show up on this board.</p>
  </main>
);

export default page;
