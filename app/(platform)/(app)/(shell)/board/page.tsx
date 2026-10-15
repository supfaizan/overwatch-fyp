import Board from '@/features/board';
import { Suspense } from 'react';

// Board reads the search params, which needs a Suspense boundary
const page = () => {
  return (
    <Suspense>
      <Board />
    </Suspense>
  );
};

export default page;
