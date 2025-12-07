import './globals.css';
import type { Metadata } from 'next';
import { Inter, Playfair_Display, Cormorant_Garamond } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant'
});

export const metadata: Metadata = {
  title: 'Samara - Luxury Sarees & Handcrafted Elegance',
  description: 'Discover exquisite handcrafted sarees blending Indian heritage with modern luxury',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} ${cormorant.variable} font-sans antialiased`}>
        <AuthProvider>
          <CartProvider>
            <div className="flex min-h-screen flex-col bg-black">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
