import { cookies } from 'next/headers'
import type { Region } from './landed-pricing'

/**
 * Reads region from middleware-set cookie
 * Server-only
 */
export async function getCurrentRegion(): Promise<Region> {
  const cookieStore = await cookies()
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
