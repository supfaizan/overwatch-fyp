import Button from '@/shared/components/button';
import GithubMark from '@/shared/components/github-mark';

export function InAButton() {
  return (
    <Button variant="primary" bg="#111" border="#000" edge="#000">
      <GithubMark />
      Continue with GitHub
    </Button>
  );
}

export function Sizes() {
  return (
    <>
      <GithubMark className="size-4" />
      <GithubMark className="size-6" />
      <GithubMark className="size-8 text-muted" />
    </>
  );
}
