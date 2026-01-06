import type { Region } from './landed-pricing';

export async function getUserRegion(): Promise<Region> {
  if (typeof window === 'undefined') return 'IN';

  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();

    const country = data?.country_code?.toUpperCase();

    switch (country) {
      case 'US':
        return 'US';
      case 'CA':
        return 'CA';
      case 'AE':
        return 'AE';
      case 'GB':
        return 'GB';
      case 'IN':
      default:
        return 'IN';
    }
  } catch {
    return 'IN';
  }
}
