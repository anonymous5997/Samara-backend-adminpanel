'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, User, Heart, Search, Menu } from 'lucide-react';
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
import { CurrencySelector } from '@/components/currency-selector';

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
    <header className="sticky top-0 z-50 w-full bg-[#050505] border-b border-[#D4AF37]/20">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex h-[72px] items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-48 h-14 transition-all duration-300 group-hover:scale-105">
                <Image
                  src="/img_2599 copy.jpeg"
                  alt="Samara - Best Handcrafted Sambalpuri Sarees"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[#F5F5F5] hover:text-[#F4D03F] transition-colors duration-300 tracking-wide hover:underline underline-offset-4"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <CurrencySelector currency={currency} onChange={setCurrency} />
            </div>

            <Button variant="ghost" size="icon" asChild className="hidden md:inline-flex text-[#D4AF37] hover:text-[#F4D03F] hover:bg-[#D4AF37]/10">
              <Link href="/search">
                <Search className="h-5 w-5" />
              </Link>
            </Button>

            {user && (
              <Button variant="ghost" size="icon" asChild className="text-[#D4AF37] hover:text-[#F4D03F] hover:bg-[#D4AF37]/10">
                <Link href="/wishlist">
                  <Heart className="h-5 w-5" />
                </Link>
              </Button>
            )}

            <Button variant="ghost" size="icon" asChild className="relative text-[#D4AF37] hover:text-[#F4D03F] hover:bg-[#D4AF37]/10">
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#D4AF37] text-xs text-black flex items-center justify-center font-semibold">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-[#D4AF37] hover:text-[#F4D03F] hover:bg-[#D4AF37]/10">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#111111] border-[#D4AF37]/20">
                  <DropdownMenuItem asChild className="text-[#F5F5F5] hover:text-[#D4AF37] focus:text-[#D4AF37]">
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-[#F5F5F5] hover:text-[#D4AF37] focus:text-[#D4AF37]">
                    <Link href="/orders">Orders</Link>
                  </DropdownMenuItem>
                  {profile?.role === 'admin' && (
                    <DropdownMenuItem asChild className="text-[#F5F5F5] hover:text-[#D4AF37] focus:text-[#D4AF37]">
                      <Link href="/admin">Admin Panel</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={signOut} className="text-[#F5F5F5] hover:text-[#D4AF37] focus:text-[#D4AF37]">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] hover:shadow-lg hover:shadow-[#D4AF37]/50 text-black font-semibold rounded-full px-6">
                <Link href="/auth/login">Sign In</Link>
              </Button>
            )}

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-[#D4AF37] hover:text-[#F4D03F] hover:bg-[#D4AF37]/10">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-[#000000] border-[#D4AF37]/20">
                <nav className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-lg font-medium text-[#F5F5F5] hover:text-[#D4AF37] transition-colors"
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
