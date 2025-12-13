'use client';

import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  Folder,
  Users,
  DollarSign,
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No auth check for local development.
  // We’ll lock this down again before production.

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Categories', href: '/admin/categories', icon: Folder },
    { name: 'Coupons', href: '/admin/coupons', icon: Tag },
    { name: 'Currency', href: '/admin/currency', icon: DollarSign },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Hero Slides', href: '/admin/hero', icon: Users },
  ];

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="w-64 bg-neutral-900 border-r border-neutral-800">
        <div className="p-6 border-b border-neutral-800">
          <h1 className="text-xl font-bold text-amber-400">Samara Admin</h1>
          <p className="text-xs text-neutral-400 mt-1">Admin Panel</p>
        </div>
        <nav className="px-3 py-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-400 hover:text-amber-400 hover:bg-neutral-800/50 mb-1 transition-colors"
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 p-8 bg-white">{children}</main>
    </div>
  );
}
