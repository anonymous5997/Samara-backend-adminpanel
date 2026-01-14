import type { Region } from '@/lib/landed-pricing'
import { getCurrentRegion as getCanonicalRegion } from '@/lib/region'

/**
 * SERVER-ONLY
 * Reads region from middleware cookie via the canonical resolver
 */
export async function getCurrentRegion(): Promise<Region> {
  return getCanonicalRegion()
}
