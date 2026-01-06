import { cookies } from 'next/headers';
import type { RegionCode } from '@/lib/region';

/**
 * SERVER ONLY
 * Uses middleware-set cookie
 */
export function getCurrentRegion(): RegionCode {
  const cookieStore = cookies();
  const region = cookieStore.get('region')?.value as RegionCode;

  if (['IN', 'US', 'AE', 'CA', 'GB', 'EU'].includes(region)) {
    return region;
  }

  return 'IN';
}
