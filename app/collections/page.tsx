import { getSiteImage } from '@/lib/site-images';
import CollectionsClient from './CollectionsClient';

// Re-check the Site Images header band at most once a minute.
export const revalidate = 60;

/** Server wrapper: resolves the optional header photo, the page itself is client-side. */
export default async function CollectionsPage() {
  const headerImage = await getSiteImage('collections-header');
  return <CollectionsClient headerImage={headerImage} />;
}
