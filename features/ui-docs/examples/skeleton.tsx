import Skeleton from '@/shared/components/skeleton';

export function ListRow() {
  return (
    <div className="flex w-full max-w-md items-center gap-3" aria-busy>
      <Skeleton className="size-10 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}
