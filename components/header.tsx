'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Heart, Menu, Search, ShoppingBag, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CurrencySelector from '@/components/currency-selector';
import { useShell } from '@/components/shell/ShellProvider';
import {
  MobileMenu,
  currencySkin,
  isActiveRoute,
  primaryNav,
} from '@/components/shell/MobileMenu';
import { useCurrencySwitch } from '@/hooks/useCurrencySwitch';
import { cn } from '@/lib/utils';

/**
 * Routes where the header floats transparently over a full-bleed hero.
 * Pathname-based so the server render matches the client (no layout jump).
 */
const OVERLAY_ROUTES = ['/'];
const SCROLL_THRESHOLD = 80;

const iconBtn =
  'relative flex h-11 w-11 items-center justify-center text-samara-ivory transition-opacity duration-300 ease-editorial hover:opacity-70 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-4px] focus-visible:outline-samara-gold';

const menuItem =
  'cursor-pointer rounded-none px-5 py-2.5 font-sans text-[11px] font-medium uppercase tracking-eyebrow text-samara-ivory/80 transition-colors focus:bg-transparent focus:text-samara-ivory data-[highlighted]:bg-transparent data-[highlighted]:text-samara-ivory';

const eyebrowLink =
  'font-sans text-[10.5px] font-medium uppercase tracking-[0.14em] text-samara-ivory xl:text-[11px] xl:tracking-[0.18em]';

/** Desktop nav: Home first, then the shared storefront links. */
const desktopNav = [{ href: '/', label: 'Home' }, ...primaryNav];

/** Compact "INR ▾": the shared skin, minus the currency symbol. */
const compactCurrency =
  '[&>div>button]:px-1.5 [&>div>button_span_span:last-child]:hidden';

function HeaderCurrency({ className }: { className?: string }) {
  const { currency, changeCurrency } = useCurrencySwitch();
  return (
    <div className={cn(currencySkin, compactCurrency, className)}>
      <CurrencySelector currency={currency} onChange={changeCurrency} />
    </div>
  );
}

/** Same footprint as HeaderCurrency while search params resolve. */
function CurrencyPlaceholder() {
  return <div className="h-11 w-[60px]" aria-hidden />;
}

export function Header() {
  const pathname = usePathname() ?? '/';
  const { user, profile, signOut, loading } = useAuth();
  const { items } = useCart();
  const { openSearch, openWishlist, openCart } = useShell();
  const [menuOpen, setMenuOpen] = useState(false);
  // Auth and the guest cart resolve in the browser, and the header can hydrate
  // after they do (it sits in a Suspense boundary). Render auth/cart-dependent
  // bits only after mount so server and first client render always match.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const cartItemsCount = mounted
    ? items.reduce((sum, item) => sum + item.quantity, 0)
    : 0;

  const isOverlay = OVERLAY_ROUTES.includes(pathname);
  // Entrance plays once, only when the first page loaded is an overlay route.
  const [playEntrance] = useState(isOverlay);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isOverlay) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [isOverlay]);

  const solid = !isOverlay || scrolled;
  const bagLabel =
    cartItemsCount > 0
      ? `Bag, ${cartItemsCount} ${cartItemsCount === 1 ? 'item' : 'items'}`
      : 'Bag, empty';

  return (
    <>
      <header
        className={cn(
          'top-0 z-[999] w-full border-b text-samara-ivory',
          'transition-[background-color,border-color,backdrop-filter] duration-700 ease-editorial',
          isOverlay ? 'fixed inset-x-0' : 'sticky',
          solid
            ? 'border-samara-line bg-samara-ink/95 backdrop-blur-md'
            : 'border-transparent bg-transparent backdrop-blur-0',
          !isOverlay && 'bg-samara-ink',
          playEntrance && 'sm-header-enter',
        )}
      >
        {/* Legibility scrim over imagery; fades out once the bar turns solid. */}
        {isOverlay && (
          <div
            aria-hidden
            className={cn(
              'pointer-events-none absolute inset-x-0 top-0 -z-10 h-[150%] bg-gradient-to-b from-black/60 via-black/25 to-transparent',
              'transition-opacity duration-700 ease-editorial',
              solid ? 'opacity-0' : 'opacity-100',
            )}
          />
        )}

        {/* Mobile: menu · logo · search+bag. Desktop: logo · nav · utilities. */}
        <div className="sm-container grid h-[60px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center lg:h-[72px] lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-6 xl:gap-10">
          {/* LEFT (mobile) */}
          <div className="order-1 flex min-w-0 items-center lg:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className={cn(iconBtn, '-ml-3')}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-haspopup="dialog"
            >
              <Menu className="h-5 w-5" strokeWidth={1.25} />
            </button>
          </div>

          {/* LOGO — centre on mobile, left on desktop; full opacity while auth loads */}
          <Link
            href="/"
            aria-label="Samara, home"
            className="order-2 flex items-center justify-center px-2 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-samara-gold lg:order-1 lg:justify-start lg:px-0"
          >
            <Image
              src="/brand/samara-logo-transparent.png"
              alt="Samara"
              width={717}
              height={214}
              sizes="(min-width: 1280px) 168px, (min-width: 1024px) 148px, 121px"
              priority
              className="h-9 w-auto lg:h-[44px] xl:h-[50px]"
            />
          </Link>

          {/* NAV (desktop) */}
          <nav aria-label="Primary" className="order-2 hidden min-w-0 justify-center lg:flex">
            <ul className="flex items-center gap-4 xl:gap-8">
              {desktopNav.map((link) => {
                const active = isActiveRoute(pathname, link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        eyebrowLink,
                        'sm-link whitespace-nowrap py-2 transition-[opacity,color] duration-300 hover:opacity-100 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-samara-gold',
                        active ? 'text-samara-gold opacity-100' : 'opacity-80',
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* RIGHT */}
          <div className="order-3 flex min-w-0 items-center justify-end">
            <div className="hidden lg:block">
              <Suspense fallback={<CurrencyPlaceholder />}>
                <HeaderCurrency className="mr-1 min-w-[60px] xl:mr-2" />
              </Suspense>
            </div>

            <button
              type="button"
              onClick={openSearch}
              className={iconBtn}
              aria-label="Search"
            >
              <Search className="h-5 w-5" strokeWidth={1.25} />
            </button>

            {/* Account — fixed footprint so the auth-loading state never shifts */}
            <div className="hidden h-11 w-11 items-center justify-center lg:flex">
              {!mounted || loading ? null : user ? (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger className={iconBtn} aria-label="Account">
                    <User className="h-5 w-5" strokeWidth={1.25} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    sideOffset={14}
                    className="z-[1000] min-w-[220px] rounded-none border-samara-line bg-samara-ink p-0 py-2 text-samara-ivory shadow-none"
                  >
                    {user.email && (
                      <>
                        <DropdownMenuLabel className="truncate px-5 pb-3 pt-2 font-sans text-xs font-normal text-samara-mute">
                          {user.email}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="mx-0 my-0 bg-samara-line" />
                      </>
                    )}
                    <div className="py-2">
                      <DropdownMenuItem asChild className={menuItem}>
                        <Link href="/profile">Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className={menuItem}>
                        <Link href="/orders">Orders</Link>
                      </DropdownMenuItem>
                      {profile?.role === 'admin' && (
                        <DropdownMenuItem asChild className={menuItem}>
                          <Link href="/admin">Admin Panel</Link>
                        </DropdownMenuItem>
                      )}
                    </div>
                    <DropdownMenuSeparator className="mx-0 my-0 bg-samara-line" />
                    <div className="pt-2">
                      <DropdownMenuItem onClick={signOut} className={cn(menuItem, 'text-samara-mute')}>
                        Sign out
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/auth/login" className={iconBtn} aria-label="Login">
                  <User className="h-5 w-5" strokeWidth={1.25} />
                </Link>
              )}
            </div>

            <button
              type="button"
              onClick={openWishlist}
              className={cn(iconBtn, 'hidden lg:flex')}
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" strokeWidth={1.25} />
            </button>

            <button
              type="button"
              onClick={openCart}
              className={cn(iconBtn, '-mr-3')}
              aria-label={bagLabel}
            >
              <ShoppingBag className="h-5 w-5" strokeWidth={1.25} />
              {cartItemsCount > 0 && (
                <span
                  aria-hidden
                  className="absolute right-[5px] top-[7px] font-sans text-[10px] font-medium leading-none tabular-nums text-samara-gold"
                >
                  {cartItemsCount > 99 ? '99+' : cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} />
    </>
  );
}

export default Header;
