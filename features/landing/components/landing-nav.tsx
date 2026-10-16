import Brand from '@/shared/components/brand';
import Button from '@/shared/components/button';
import Link from 'next/link';

export default function LandingNav({ signIn }: { signIn: boolean }) {
  return (
    <nav className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-6 md:px-8">
      <Brand />
      {signIn && (
        <Button asChild className="px-8">
          <Link href="/sign-in">Log in</Link>
        </Button>
      )}
    </nav>
  );
}
