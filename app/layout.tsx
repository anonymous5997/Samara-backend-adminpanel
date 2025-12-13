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
  title: 'Samara - Best Handcrafted Sambalpuri Sarees | Traditional Indian Sarees',
  description: 'Discover the finest handcrafted Sambalpuri sarees at Samara. Authentic traditional Indian sarees woven with heritage craftsmanship, featuring exquisite designs and premium quality.',
  keywords: 'sambalpuri saree, handcrafted sarees, traditional sarees, sambalpuri silk saree, indian sarees online, ethnic wear, handloom sarees, authentic sambalpuri, samara sarees, traditional indian wear',

  openGraph: {
    title: 'Samara - Best Handcrafted Sambalpuri Sarees',
    description: 'Authentic handcrafted Sambalpuri sarees woven with traditional Indian craftsmanship. Premium quality ethnic wear for the modern woman.',
    type: 'website',
    locale: 'en_IN',
  },

  // ✅ UPDATED FAVICON HERE
  icons: {
    icon: '/img_2601.jpeg',
    shortcut: '/img_2601.jpeg',
    apple: '/img_2601.jpeg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </head>

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
