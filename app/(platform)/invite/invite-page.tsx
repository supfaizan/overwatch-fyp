'use client';

import { AddEmailAction, InviteSignUp, SignIn } from '@/features/auth';
import Invite from '@/features/invite';

// composes the invite feature with the auth screens a signed-out invitee needs
export default function InvitePage() {
  return (
    <Invite
      renderSignIn={(props) => {
        return <SignIn {...props} from="/invite" />;
      }}
      renderSignUp={(props) => {
        return <InviteSignUp {...props} />;
      }}
      renderAddEmail={(props) => {
        return <AddEmailAction {...props} />;
      }}
    />
  );
}
