import { getSiteImage } from '@/lib/site-images';
import FestiveEditClient from './FestiveEditClient';

// Re-check the Site Images header band at most once a minute.
export const revalidate = 60;

/** Server wrapper: resolves the optional header photo, the page itself is client-side. */
export default async function FestiveEditPage() {
  const headerImage = await getSiteImage('festive-header');
  return <FestiveEditClient headerImage={headerImage} />;
}
