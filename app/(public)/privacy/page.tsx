import { Footer } from '@/features/landing';
import LegalPage, { LEGAL_DOCUMENTS } from '@/features/legal';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: LEGAL_DOCUMENTS.privacy.title };

const page = () => {
  return (
    <>
      <LegalPage document="privacy" />
      <Footer />
    </>
  );
};

export default page;
