export default function PrivacyPolicy() {
  return (
    <div className="bg-samara-void text-samara-ivory min-h-screen pt-32 pb-24 md:pb-32">
      <div className="container mx-auto px-6 md:px-12 lg:px-16 max-w-3xl">
        <div className="text-center mb-16">
          <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-samara-gold mb-4 block">
            Legal
          </span>
          <h1 className="text-4xl md:text-5xl font-serif text-samara-ivory mb-6">
            Privacy <em className="italic text-samara-gold">Policy</em>
          </h1>
          <div className="w-px h-12 bg-samara-gold/30 mx-auto"></div>
        </div>

        <div className="prose prose-invert prose-samara max-w-none">
          <p className="text-sm font-sans tracking-wide leading-relaxed text-samara-ivory/80 mb-6">
            Samara respects your privacy. This policy explains how we collect,
            use, and protect your information when you use our website and services.
          </p>

          <h2 className="text-2xl font-serif text-samara-gold mt-12 mb-6">Information Collection</h2>
          <p className="text-sm font-sans tracking-wide leading-relaxed text-samara-ivory/80 mb-6">
            We use authentication providers such as Google and Facebook for sign-in,
            and store user profile and order-related data securely. When you make a purchase,
            we collect necessary information to process your order, including shipping details
            and payment information.
          </p>

          <h2 className="text-2xl font-serif text-samara-gold mt-12 mb-6">Use of Information</h2>
          <p className="text-sm font-sans tracking-wide leading-relaxed text-samara-ivory/80 mb-6">
            Your information is used strictly for order fulfillment, customer support, and
            enhancing your shopping experience. We do not sell your personal data to third parties.
          </p>

          <div className="mt-16 pt-8 border-t border-samara-ivory/10 text-center">
            <p className="text-sm font-sans tracking-wide text-samara-ivory/60 mb-4">
              Questions regarding our privacy practices?
            </p>
            <a href="mailto:support@samaracreations.com" className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-gold border-b border-samara-gold/30 hover:border-samara-gold pb-1 transition-colors">
              support@samaracreations.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
