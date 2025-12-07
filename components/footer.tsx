import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-[#D4AF37]/10 bg-black mt-auto">
      <div className="container mx-auto px-4 md:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
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
                <Link href="/shop" className="text-gray-400 hover:text-[#D4AF37] transition-colors duration-300">
                  Shop All
                </Link>
              </li>
              <li>
                <Link href="/sarees" className="text-gray-400 hover:text-[#D4AF37] transition-colors duration-300">
                  Sarees
                </Link>
              </li>
              <li>
                <Link href="/collections/coord-sets" className="text-gray-400 hover:text-[#D4AF37] transition-colors duration-300">
                  Co-ord Sets
                </Link>
              </li>
              <li>
                <Link href="/collections/kurta-sets" className="text-gray-400 hover:text-[#D4AF37] transition-colors duration-300">
                  Kurta Sets
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-lg font-semibold mb-6 text-[#D4AF37]">Support</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-[#D4AF37] transition-colors duration-300">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-[#D4AF37] transition-colors duration-300">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-[#D4AF37] transition-colors duration-300">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-[#D4AF37] transition-colors duration-300">
                  Returns
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-lg font-semibold mb-6 text-[#D4AF37]">Newsletter</h4>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Subscribe to receive updates, access to exclusive deals, and more
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-[#0b0b0b] border-2 border-[#D4AF37]/20 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition-colors text-sm"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] hover:shadow-lg hover:shadow-[#D4AF37]/50 text-black font-bold rounded-lg transition-all duration-300 hover:scale-105"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-[#D4AF37]/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Samara. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/contact" className="text-gray-500 hover:text-[#D4AF37] transition-colors">
                Privacy Policy
              </Link>
              <Link href="/contact" className="text-gray-500 hover:text-[#D4AF37] transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
