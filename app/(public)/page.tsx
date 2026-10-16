import Landing, { Footer, SECTION_IDS } from '@/features/landing';
import Waitlist from '@/features/waitlist';
import { WAITLIST_ACTIVE } from '@/shared/lib/env';

const page = () => {
  return (
    <>
      <Landing waitlistAnchor={WAITLIST_ACTIVE ? SECTION_IDS.waitlist : undefined} />
      {WAITLIST_ACTIVE && <Waitlist id={SECTION_IDS.waitlist} />}
      <Footer />
    </>
  );
};

export default page;
