import { getSiteImage } from '@/lib/site-images';
import SareesClient from './SareesClient';

// Re-check the Site Images header band at most once a minute.
export const revalidate = 60;

/** Server wrapper: resolves the optional header photo, the page itself is client-side. */
export default async function SareesPage() {
  const headerImage = await getSiteImage('sarees-header');
  return <SareesClient headerImage={headerImage} />;
}
