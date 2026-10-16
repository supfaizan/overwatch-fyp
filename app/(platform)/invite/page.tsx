import type { Metadata } from 'next';
import InvitePage from './invite-page';

export const metadata: Metadata = { title: 'Join a workspace' };

// the token arrives after `#`, which never reaches the server; the page reads it in the browser
const page = () => {
  return <InvitePage />;
};

export default page;
