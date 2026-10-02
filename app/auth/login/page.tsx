import { getSiteImage } from '@/lib/site-images';
import LoginClient from './LoginClient';

// Re-check the Site Images brand-panel photo at most once a minute.
export const revalidate = 60;

/** Server wrapper: resolves the optional brand-panel photo, the form itself is client-side. */
export default async function LoginPage() {
  const brandImage = await getSiteImage('login');
  return <LoginClient brandImage={brandImage} />;
}
