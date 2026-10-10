import Link from 'next/link';
import Card from '@/shared/components/card';

// placeholder until the dashboard step
const page = () => (
  <main className="mx-auto max-w-xl py-10">
    <Card className="flex flex-col gap-2 p-6">
      <h1 className="text-lg font-bold">Dashboard</h1>
      <p className="text-sm text-muted">
        The architecture dashboard arrives in the next step. Your repositories are indexed and kept in sync meanwhile.
      </p>
      <Link href="/onboarding" className="text-sm text-primary hover:underline">
        Review your setup
      </Link>
    </Card>
  </main>
);

export default page;
