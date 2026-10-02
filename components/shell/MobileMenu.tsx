'use client';

import { Suspense, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Heart, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import CurrencySelector from '@/components/currency-selector';
import { useShell } from '@/components/shell/ShellProvider';
import { useCurrencySwitch } from '@/hooks/useCurrencySwitch';
import { cn } from '@/lib/utils';

/* Shared with components/header.tsx (which imports from here). */
export const primaryNav = [
  { href: '/sarees', label: 'Sarees' },
  { href: '/collections', label: 'Collections' },
  { href: '/shop', label: 'New Arrivals' },
  { href: '/#best-sellers', label: 'Best Sellers' },
  { href: '/about', label: 'Our Story' },
];

export function isActiveRoute(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  if (href.includes('#')) return false; // in-page anchors are never "the current page"
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Kept for compatibility; CurrencySelector now carries the Samara styling itself. */
export const currencySkin = '';


const menuNav = [
  { href: '/', label: 'Home' },
  ...primaryNav,
  { href: '/contact', label: 'Contact' },
];

const utilityLink =
  'flex min-h-[44px] items-center font-sans text-[11px] font-medium uppercase tracking-eyebrow text-samara-ivory/[0.85] transition-colors duration-300 hover:text-samara-ivory focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-samara-gold';

function MenuCurrency() {
  const { currency, changeCurrency } = useCurrencySwitch();
  return (
    <div className={cn(currencySkin, '-ml-2')}>
      <CurrencySelector currency={currency} onChange={changeCurrency} align="left" placement="up" />
    </div>
  );
}

interface MobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Left-hand navigation drawer for < 1024px. Radix Dialog gives focus
 * trapping, Esc and scroll locking; .sm-drawer-* handle the motion.
 */
export function MobileMenu({ open, onOpenChange }: MobileMenuProps) {
  const pathname = usePathname() ?? '/';
  const { user, profile, signOut, loading } = useAuth();
  const { openWishlist } = useShell();

  // Close on any route change (covers links, back/forward, programmatic nav).
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      onOpenChange(false);
    }
  }, [pathname, onOpenChange]);

  const close = () => onOpenChange(false);
  let i = 0;
  const stagger = () => ({ ['--i' as string]: i++ });

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="sm-drawer-overlay fixed inset-0 z-[1100] bg-black/60 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          data-side="left"
          aria-describedby={undefined}
          className="sm-drawer-panel fixed inset-y-0 left-0 z-[1101] flex h-[100dvh] w-full max-w-[420px] flex-col border-r border-samara-line bg-samara-ink text-samara-ivory outline-none"
        >
          {/* Top bar mirrors the header: close sits where the menu button was */}
          <div className="flex h-[60px] shrink-0 items-center justify-between px-4 pt-[env(safe-area-inset-top)] sm:px-6">
            <DialogPrimitive.Close
              className="-ml-3 flex h-11 w-11 items-center justify-center text-samara-ivory transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-4px] focus-visible:outline-samara-gold"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" strokeWidth={1.25} />
            </DialogPrimitive.Close>
            <DialogPrimitive.Title className="sr-only">Menu</DialogPrimitive.Title>
            <Link
              href="/"
              onClick={() => onOpenChange(false)}
              aria-label="Samara, home"
              className="flex items-center focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-samara-gold"
            >
              <Image
                src="/brand/samara-logo-transparent.png"
                alt="Samara"
                width={717}
                height={214}
                sizes="121px"
                className="h-9 w-auto"
              />
            </Link>
            <span className="w-11" aria-hidden />
          </div>
          <div className="sm-hairline shrink-0" />

          <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-10">
            <nav aria-label="Menu" className="pb-10 pt-8">
              <ul className="space-y-1">
                {menuNav.map((link) => {
                  const active = isActiveRoute(pathname, link.href);
                  return (
                    <li key={link.href} className="sm-stagger" style={stagger()}>
                      <Link
                        href={link.href}
                        onClick={close}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'group flex items-baseline gap-4 py-1.5 font-serif text-[2.5rem] font-light leading-[1.1] tracking-[-0.01em] transition-colors duration-300 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-samara-gold sm:text-[3rem]',
                          active ? 'italic text-samara-gold' : 'text-samara-ivory hover:text-samara-ivory/70',
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="sm-hairline sm-stagger" style={stagger()} />

            <div className="grid grid-cols-1 gap-8 py-8 min-[420px]:grid-cols-2">
              {/* Account */}
              <section className="sm-stagger" style={stagger()} aria-labelledby="menu-account">
                <h2 id="menu-account" className="sm-eyebrow mb-2 text-samara-mute">
                  Account
                </h2>
                {/* Reserve the block's height while auth resolves */}
                <ul className={cn(loading && 'invisible')} aria-hidden={loading || undefined}>
                  {user ? (
                    <>
                      <li>
                        <Link href="/profile" onClick={close} className={utilityLink}>
                          Profile
                        </Link>
                      </li>
                      <li>
                        <Link href="/orders" onClick={close} className={utilityLink}>
                          Orders
                        </Link>
                      </li>
                      {profile?.role === 'admin' && (
                        <li>
                          <Link href="/admin" onClick={close} className={utilityLink}>
                            Admin Panel
                          </Link>
                        </li>
                      )}
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            close();
                            signOut();
                          }}
                          className={cn(utilityLink, 'text-samara-mute')}
                        >
                          Sign out
                        </button>
                      </li>
                    </>
                  ) : (
                    <li>
                      <Link href="/auth/login" onClick={close} className={utilityLink}>
                        Login
                      </Link>
                    </li>
                  )}
                </ul>
              </section>

              <div className="space-y-8">
                <section className="sm-stagger" style={stagger()} aria-label="Wishlist">
                  <h2 className="sm-eyebrow mb-2 text-samara-mute" aria-hidden>
                    Saved
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      openWishlist();
                    }}
                    className={cn(utilityLink, 'gap-3')}
                  >
                    <Heart className="h-4 w-4" strokeWidth={1.25} aria-hidden />
                    Wishlist
                  </button>
                </section>

                <section className="sm-stagger" style={stagger()} aria-labelledby="menu-currency">
                  <h2 id="menu-currency" className="sm-eyebrow mb-1 text-samara-mute">
                    Currency
                  </h2>
                  <Suspense fallback={<div className="h-11" aria-hidden />}>
                    <MenuCurrency />
                  </Suspense>
                </section>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
