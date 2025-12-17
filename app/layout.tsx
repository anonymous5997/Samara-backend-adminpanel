// app/layout.tsx (SERVER COMPONENT)
import "./globals.css";
import type { Metadata } from "next";
import { Inter, Playfair_Display, Cormorant_Garamond } from "next/font/google";
import ClientProviders from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
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
    <html lang="en">
      <head>
        <script
          src="https://checkout.razorpay.com/v1/checkout.js"
          async
        ></script>
      </head>

      <body
        className={`${inter.variable} ${playfair.variable} ${cormorant.variable} font-sans antialiased`}
      >
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
