import { cookies } from 'next/headers'
import type { Region } from './landed-pricing'

/**
 * Reads region from middleware-set cookie
 * This runs ONLY on the server (safe)
 */
export function getCurrentRegion(): Region {
  const cookieStore = cookies()
  const region = cookieStore.get('region')?.value

  switch (region) {
    case 'US':
    case 'CA':
    case 'AE':
    case 'GB':
      return region
    case 'IN':
    default:
      return 'IN'
  }
}
