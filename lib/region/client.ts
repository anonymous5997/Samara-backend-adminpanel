export type Region = 'IN' | 'US' | 'CA' | 'AE' | 'GB';

const COOKIE_NAME = 'region';

export function getUserRegion(): Region {
  if (typeof document === 'undefined') return 'IN';

  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith(COOKIE_NAME + '='));

  return (match?.split('=')[1] as Region) || 'IN';
}

export function setUserRegion(region: Region) {
  document.cookie = `${COOKIE_NAME}=${region}; path=/; max-age=31536000; SameSite=Lax`;
}
