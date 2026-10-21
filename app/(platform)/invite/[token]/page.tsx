import type { Metadata } from 'next';
import InvitePage from '../invite-page';

export const metadata: Metadata = { title: 'Join a workspace' };

// links sent before tokens moved into the fragment; remove once they've all expired (7 days after release)
const page = () => {
  return <InvitePage />;
};

export default page;
