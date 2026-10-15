import type { Metadata } from 'next';
import InvitePage from '../invite-page';

export const metadata: Metadata = { title: 'Join a workspace · Overwatch' };

// links sent before tokens moved into the fragment; remove once they've all expired (7 days after release)
const page = () => <InvitePage />;

export default page;
