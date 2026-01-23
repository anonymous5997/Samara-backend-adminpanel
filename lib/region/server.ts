import { cookies, headers } from 'next/headers';

export type Region = 'IN' | 'US' | 'CA' | 'AE' | 'GB';

export async function getCurrentRegion(): Promise<Region> {
  const cookieStore = await cookies();
  const saved = cookieStore.get('region')?.value as Region | undefined;

  // 1️⃣ If user already has a region cookie → trust it
  if (saved) return saved;

  // 2️⃣ Read geo headers (Vercel / Cloudflare)
  const h = await headers();
  const country =
    h.get('x-vercel-ip-country') ||
    h.get('cf-ipcountry');

  let region: Region = 'IN';

  switch (country) {
    case 'US':
      region = 'US';
      break;
    case 'CA':
      region = 'CA';
      break;
    case 'AE':
      region = 'AE';
      break;
    case 'GB':
      region = 'GB';
      break;
    case 'IN':
    default:
      region = 'IN';
  }

  // 3️⃣ Persist region for future requests
  cookieStore.set('region', region, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  return region;
}
