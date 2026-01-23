// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import ClientProviders from "./providers";
import Script from "next/script";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "Samara - Best Handcrafted Sambalpuri Sarees | Traditional Indian Sarees",
  description:
    "Discover the finest handcrafted Sambalpuri sarees at Samara. Authentic traditional Indian sarees woven with heritage craftsmanship.",
  icons: {
    icon: "/img_2601.jpeg",
    shortcut: "/img_2601.jpeg",
    apple: "/img_2601.jpeg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={playfair.variable}>
      <body className="antialiased">
        {/* Razorpay SDK - Load AFTER page is interactive */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />

        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}