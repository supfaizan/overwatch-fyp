import Button from '@/shared/components/button';
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/shared/components/dialog';

export function Confirmation() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Delete dashboard</Button>
      </DialogTrigger>
      <DialogContent
        title="Delete dashboard?"
        description="This removes My App Dashboard for everyone on the team."
        footer={
          <>
            <DialogClose asChild>
              <Button>Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="primary" bg="var(--color-danger)" border="#9e2804" edge="#9e2804">
                Delete dashboard
              </Button>
            </DialogClose>
          </>
        }
      />
    </Dialog>
  );
}
