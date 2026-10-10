import { Plus } from '@phosphor-icons/react/ssr';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';

export function WithAction() {
  return (
    <Banner
      className="w-full"
      dismissible
      action={
        <Button size="sm">
          <Plus />
          Invite team members
        </Button>
      }
    >
      Get more out of Overwatch by inviting your team for free
    </Banner>
  );
}

export function Types() {
  return (
    <div className="flex w-full flex-col gap-3">
      <Banner type="success">Repository connected, parsing has started.</Banner>
      <Banner type="warning">Jira sync is behind by 2 hours.</Banner>
      <Banner type="error">GitHub token expired. Reconnect to keep syncing.</Banner>
    </div>
  );
}
