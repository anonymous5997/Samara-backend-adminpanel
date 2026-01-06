// lib/region/client.ts
'use client';

export type RegionCode = 'IN' | 'US' | 'CA' | 'AE' | 'GB' | 'EU';

const STORAGE_KEY = 'user_region';

export function getUserRegion(): RegionCode {
  if (typeof window === 'undefined') return 'IN';

  return (localStorage.getItem(STORAGE_KEY) as RegionCode) || 'IN';
}

export function setUserRegion(region: RegionCode) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, region);
}
