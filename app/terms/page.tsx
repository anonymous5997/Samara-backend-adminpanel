export default function Terms() {
  return (
    <div className="bg-samara-void text-samara-ivory min-h-screen pt-32 pb-24 md:pb-32">
      <div className="container mx-auto px-6 md:px-12 lg:px-16 max-w-3xl">
        <div className="text-center mb-16">
          <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-samara-gold mb-4 block">
            Legal
          </span>
          <h1 className="text-4xl md:text-5xl font-serif text-samara-ivory mb-6">
            Terms of <em className="italic text-samara-gold">Service</em>
          </h1>
          <div className="w-px h-12 bg-samara-gold/30 mx-auto"></div>
        </div>

        <div className="prose prose-invert prose-samara max-w-none">
          <p className="text-sm font-sans tracking-wide leading-relaxed text-samara-ivory/80 mb-6">
            By using Samara, you agree to our terms regarding purchases,
            accounts, and acceptable use of the platform.
          </p>
          
          <h2 className="text-2xl font-serif text-samara-gold mt-12 mb-6">Purchases & Availability</h2>
          <p className="text-sm font-sans tracking-wide leading-relaxed text-samara-ivory/80 mb-6">
            All orders are subject to availability. As our pieces are handcrafted, slight variations in color,
            texture, and finish may occur, which add to the unique beauty of each garment.
          </p>

          <h2 className="text-2xl font-serif text-samara-gold mt-12 mb-6">Intellectual Property</h2>
          <p className="text-sm font-sans tracking-wide leading-relaxed text-samara-ivory/80 mb-6">
            All content on this website, including images, text, and design, is the property of Samara
            and may not be used or reproduced without express written permission.
          </p>

          <div className="mt-16 pt-8 border-t border-samara-ivory/10 text-center">
            <p className="text-[10px] font-sans tracking-widest uppercase text-samara-ivory/40">
              Last Updated: October 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
