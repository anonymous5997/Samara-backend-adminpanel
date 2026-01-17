'use client';

export type RegionCode = 'IN' | 'US' | 'CA' | 'AE' | 'GB' | 'EU';

const COOKIE_NAME = 'region';

function setCookie(name: string, value: string, days = 30) {
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith(name + '='));
  return match ? match.split('=')[1] : null;
}

export function setUserRegion(region: RegionCode) {
  if (typeof window === 'undefined') return;
  setCookie(COOKIE_NAME, region);
}

export function getUserRegion(): RegionCode {
  if (typeof window === 'undefined') return 'IN';
  return (getCookie(COOKIE_NAME) as RegionCode) || 'IN';
}
