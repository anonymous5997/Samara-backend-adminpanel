import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-[#D4AF37]/10 bg-black mt-auto">
      <div className="container mx-auto px-4 md:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div>
            <Link href="/" className="inline-block mb-6">
              <img
                src="/img_2599.jpeg"
                alt="Samara"
                className="h-14 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Woven for every woman. Discover exquisite handcrafted sarees blending tradition with modern elegance.
            </p>
          </div>

          <div>
            <h4 className="font-serif text-lg font-semibold mb-6 text-[#D4AF37]">Shop</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/sarees" className="text-gray-400 hover:text-[#D4AF37] transition-colors duration-300">
                  All Sarees
                </Link>
              </li>
              <li>
                <Link href="/collections" className="text-gray-400 hover:text-[#D4AF37] transition-colors duration-300">
                  Collections
                </Link>
              </li>
              <li>
                <Link href="/festive-edit" className="text-gray-400 hover:text-[#D4AF37] transition-colors duration-300">
                  Festive Edit
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-lg font-semibold mb-6 text-[#D4AF37]">Customer Care</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-[#D4AF37] transition-colors duration-300">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-gray-400 hover:text-[#D4AF37] transition-colors duration-300">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="text-gray-400 hover:text-[#D4AF37] transition-colors duration-300">
                  Wishlist
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-lg font-semibold mb-6 text-[#D4AF37]">About</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-[#D4AF37] transition-colors duration-300">
                  Our Story
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-[#D4AF37] transition-colors duration-300">
                  Get in Touch
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-gray-400 hover:text-[#D4AF37] transition-colors duration-300">
                  Admin
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#D4AF37]/10 pt-8 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Samara. All rights reserved. Crafted with love for Indian handlooms.
          </p>
        </div>
      </div>
    </footer>
  );
}
