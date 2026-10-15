import Dashboard from '@/features/dashboard';
import { Suspense } from 'react';

// Dashboard reads the search params, which needs a Suspense boundary
const page = () => (
  <Suspense>
    <Dashboard />
  </Suspense>
);

export default page;
