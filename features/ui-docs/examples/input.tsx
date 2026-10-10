import { ArrowRight, Search } from 'lucide-react';
import { Input, TextArea } from '@/shared/components/input';
import Kbd from '@/shared/components/kbd';

export function WithLabel() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-1.5">
      <label htmlFor="repo-name" className="text-sm font-medium">
        Repository name
      </label>
      <Input id="repo-name" placeholder="overwatch-fyp" />
    </div>
  );
}

export function PrefixAndSuffix() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <Input aria-label="Search dashboards" placeholder="Search for dashboards" prefix={<Search />} suffix={<Kbd>⌘K</Kbd>} />
      <Input
        size="lg"
        aria-label="Ask"
        placeholder="What can I help you with?"
        suffix={
          <>
            <span className="text-xs whitespace-nowrap text-muted">Tab to search</span>
            <ArrowRight />
          </>
        }
      />
    </div>
  );
}

export function Invalid() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-1.5">
      <label htmlFor="email" className="text-sm font-medium">
        Email
      </label>
      <Input id="email" defaultValue="not-an-email" aria-invalid aria-describedby="email-error" />
      <p id="email-error" className="text-xs text-danger">
        Enter a valid email address.
      </p>
    </div>
  );
}

export function MultiLine() {
  return <TextArea className="max-w-xl" aria-label="Description" placeholder="Describe the issue..." />;
}
