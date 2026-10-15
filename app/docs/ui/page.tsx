import UiDocs from '@/features/ui-docs';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = { title: 'UI components', robots: { index: false } };

// internal docs: always on in `pnpm dev`, opt in elsewhere with ENABLE_UI_DOCS=true, 404 in prod
const enabled = process.env.NODE_ENV === 'development' || process.env.ENABLE_UI_DOCS === 'true';

const page = () => (enabled ? <UiDocs /> : notFound());

export default page;
