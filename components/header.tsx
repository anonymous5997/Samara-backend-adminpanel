'use client';

import Link from 'next/link';
import { ShoppingCart, User, Heart, Search, Menu, Crown } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/sarees', label: 'Sarees' },
  { href: '/collections', label: 'Collections' },
  { href: '/festive-edit', label: 'Festive Edit' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function Header() {
  const { user, profile, signOut } = useAuth();
  const { items, currency, setCurrency } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gold/20 bg-black/95 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-18 items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center shadow-lg shadow-gold/20 group-hover:shadow-gold/40 transition-all duration-300">
                <Crown className="h-5 w-5 text-black" />
              </div>
              <span className="text-2xl font-display font-semibold text-gold tracking-luxury">
                SAMARA
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-gray-300 hover:text-gold transition-colors duration-300 tracking-wide"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-gold hover:bg-gold/10">
                  {currency}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-luxury-charcoal border-gold/20">
                <DropdownMenuItem onClick={() => setCurrency('INR')} className="text-gray-300 hover:text-gold focus:text-gold">
                  INR (₹)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrency('USD')} className="text-gray-300 hover:text-gold focus:text-gold">
                  USD ($)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrency('AED')} className="text-gray-300 hover:text-gold focus:text-gold">
                  AED (د.إ)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" asChild className="hidden md:inline-flex text-gray-300 hover:text-gold hover:bg-gold/10">
              <Link href="/search">
                <Search className="h-5 w-5" />
              </Link>
            </Button>

            {user && (
              <Button variant="ghost" size="icon" asChild className="text-gray-300 hover:text-gold hover:bg-gold/10">
                <Link href="/wishlist">
                  <Heart className="h-5 w-5" />
                </Link>
              </Button>
            )}

            <Button variant="ghost" size="icon" asChild className="relative text-gray-300 hover:text-gold hover:bg-gold/10">
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gold text-xs text-black flex items-center justify-center font-semibold">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-300 hover:text-gold hover:bg-gold/10">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-luxury-charcoal border-gold/20">
                  <DropdownMenuItem asChild className="text-gray-300 hover:text-gold focus:text-gold">
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-gray-300 hover:text-gold focus:text-gold">
                    <Link href="/orders">Orders</Link>
                  </DropdownMenuItem>
                  {profile?.role === 'admin' && (
                    <DropdownMenuItem asChild className="text-gray-300 hover:text-gold focus:text-gold">
                      <Link href="/admin">Admin Panel</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={signOut} className="text-gray-300 hover:text-gold focus:text-gold">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" className="bg-gold hover:bg-gold-light text-black font-semibold">
                <Link href="/auth/login">Sign In</Link>
              </Button>
            )}

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-gray-300 hover:text-gold hover:bg-gold/10">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-luxury-black border-gold/20">
                <nav className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-lg font-medium text-gray-300 hover:text-gold transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
