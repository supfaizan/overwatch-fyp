import { Suspense } from 'react';
import Dashboard from '@/features/dashboard';

// Dashboard reads the search params, which needs a Suspense boundary
const page = () => (
  <Suspense>
    <Dashboard />
  </Suspense>
);

export default page;
