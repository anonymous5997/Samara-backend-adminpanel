'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { AccountHero, BTN_GOLD, Eyebrow, FOCUS, TEXT_LINK } from '@/components/account/ui';
import { WishlistCard } from '@/components/account/WishlistCard';
import { useRouter } from 'next/navigation';

export default function WishlistPage() {
  const router = useRouter();
  // Fetching, removal, add-to-bag and price formatting live in useWishlist.
  const { user, items, loading, removeFromWishlist, handleAddToCart, formatPrice } =
    useWishlist();

  // Wait for auth to resolve before deciding; otherwise a signed-in user
  // opening /wishlist directly is bounced to /auth/login on first render.
  const { loading: authLoading } = useAuth();
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-samara-ink">
        <div className="sm-eyebrow animate-pulse motion-reduce:animate-none">Loading...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-samara-ink">
        <div className="sm-container grid min-h-[72vh] items-center py-20 md:py-28">
          <div className="max-w-2xl">
            <Eyebrow className="sm-anim-fade-up">My Wishlist</Eyebrow>
            <h1 className="sm-display-l sm-anim-fade-up mt-6 font-light [--anim-delay:80ms]">
              Your wishlist is <span className="sm-accent">empty</span>
            </h1>
            <p className="sm-body sm-anim-fade-up mt-6 max-w-[40ch] [--anim-delay:160ms]">
              Save your favorite products to come back to them later
            </p>
            <div className="sm-anim-fade-up mt-10 flex flex-wrap items-center gap-x-10 gap-y-6 [--anim-delay:240ms]">
              <Link href="/shop" className={cn(BTN_GOLD, 'w-full sm:w-auto')}>
                Continue Shopping
                <ArrowRight className="h-4 w-4" strokeWidth={1.25} />
              </Link>
              <Link href="/collections" className={cn(TEXT_LINK, FOCUS, 'text-samara-ivory hover:text-samara-gold')}>
                Explore collections
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-samara-ink">
      <AccountHero
        eyebrow={<>{items.length} {items.length === 1 ? 'Piece' : 'Pieces'} saved</>}
        title={<>My <span className="sm-accent">Wishlist</span></>}
        intro="Save your favorite products to come back to them later"
        aside={
          <Link href="/shop" className={cn(TEXT_LINK, FOCUS, 'text-samara-mute hover:text-samara-ivory')}>
            Continue Shopping
          </Link>
        }
      />

      <section aria-label="Saved pieces" className="bg-samara-cream text-samara-cream-ink">
        <div className="sm-container py-14 md:py-20 lg:py-24">
          <ul className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 md:grid-cols-3 md:gap-y-16 xl:grid-cols-4">
            {items.map(({ product, image }, index) => (
              <li key={product.id} className="sm-stagger" style={{ ['--i' as string]: index }}>
                <WishlistCard
                  index={index}
                  name={product.name}
                  href={`/products/${product.slug}`}
                  imageUrl={image ? image.image_url : null}
                  price={formatPrice(product)}
                  onAddToBag={() => handleAddToCart(product.id)}
                  onRemove={() => removeFromWishlist(product.id)}
                />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
