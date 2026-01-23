'use client';

import dynamic from 'next/dynamic';

const Select = dynamic(
  () => import('react-select').then(mod => mod.default),
  { ssr: false }
);

export default Select;
