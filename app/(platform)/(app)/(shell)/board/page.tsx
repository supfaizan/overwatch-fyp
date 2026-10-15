import { Suspense } from 'react';
import Board from '@/features/board';

// Board reads the search params, which needs a Suspense boundary
const page = () => (
  <Suspense>
    <Board />
  </Suspense>
);

export default page;
