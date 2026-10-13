import Avatar from '@/shared/components/avatar';

export function WithImage() {
  return <Avatar src="https://avatars.githubusercontent.com/u/583231" name="The Octocat" />;
}

export function InitialsFallback() {
  return <Avatar name="Ada Lovelace" />;
}

export function Sizes() {
  return (
    <>
      <Avatar name="Grace Hopper" size="sm" />
      <Avatar name="Grace Hopper" size="md" />
      <Avatar name="Grace Hopper" size="lg" />
    </>
  );
}
