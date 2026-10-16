import Dashboard from '@/features/dashboard';
import { Suspense } from 'react';

// Dashboard reads the search params, which needs a Suspense boundary
const page = () => {
  return (
    <Suspense>
      <Dashboard />
    </Suspense>
  );
};

export default page;
