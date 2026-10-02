import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="bg-samara-void text-samara-ivory min-h-screen pt-32 pb-24 md:pb-32 overflow-hidden">
      
      {/* HERO SECTION */}
      <section className="relative px-6 md:px-12 lg:px-16 mb-24 md:mb-32">
        <div className="container mx-auto max-w-5xl text-center">
          <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-samara-gold mb-6 block">
            The Story
          </span>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-samara-ivory mb-8">
            Where Heritage Meets <br className="hidden md:block"/>
            <em className="italic text-samara-gold">Modern Elegance</em>
          </h1>
          <div className="w-px h-16 bg-samara-gold/30 mx-auto"></div>
        </div>
      </section>

      {/* FEATURE 1: WOVEN LUXURY */}
      <section className="px-6 md:px-12 lg:px-16 mb-24 md:mb-32">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative aspect-[3/4] md:aspect-[4/5] border border-samara-ivory/10 p-2 md:order-last">
              <div className="absolute top-0 right-0 w-24 h-24 border-t border-r border-samara-gold/30 -mt-px -mr-px hidden md:block" />
              <div className="absolute bottom-0 left-0 w-24 h-24 border-b border-l border-samara-gold/30 -mb-px -ml-px hidden md:block" />
              <div className="relative w-full h-full bg-samara-void1">
                {/* Fallback pattern if image is missing */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #D4AF37 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                <Image
                  src="/img_2599.jpeg"
                  alt="Samara Brand Image"
                  fill
                  className="object-cover object-center grayscale hover:grayscale-0 transition-all duration-700"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
            <div className="space-y-8 md:pr-10">
              <h2 className="text-3xl md:text-4xl font-serif text-samara-gold">
                Woven Luxury
              </h2>
              <p className="text-sm font-sans tracking-wide leading-relaxed text-samara-ivory/80">
                At Samara, we celebrate the timeless art of saree weaving. Each piece in our collection
                is a testament to generations of skilled craftsmanship, meticulously handwoven by master
                artisans who pour their heritage into every thread.
              </p>
              <p className="text-sm font-sans tracking-wide leading-relaxed text-samara-ivory/80">
                Our sarees are more than garments—they are wearable art, designed to make every woman
                feel like royalty. From the lustrous silks of Banaras to the delicate cottons of Bengal,
                we bring you the finest textiles India has to offer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE 2: INDIAN HERITAGE */}
      <section className="px-6 md:px-12 lg:px-16 mb-24 md:mb-32">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-samara-void1 border border-samara-ivory/10 p-10 md:p-16 lg:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-samara-gold/5 blur-[60px] rounded-full" />
            
            <h2 className="text-3xl md:text-4xl font-serif text-samara-gold mb-10 relative z-10">
              Indian Heritage, Contemporary Spirit
            </h2>
            <div className="space-y-8 max-w-3xl mx-auto relative z-10 text-left md:text-center">
              <p className="text-sm font-sans tracking-wide leading-relaxed text-samara-ivory/80">
                Founded on the belief that tradition and modernity can coexist beautifully, Samara bridges
                the gap between classical Indian textiles and contemporary fashion sensibilities. We work
                directly with weavers and artisan communities across India, ensuring fair compensation and
                preserving ancient weaving techniques for future generations.
              </p>
              <p className="text-sm font-sans tracking-wide leading-relaxed text-samara-ivory/80">
                Each Samara saree tells a story of dedication, skill, and passion. Whether you're looking
                for everyday elegance or showstopping festive wear, our curated collections offer something
                special for every occasion and every woman.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* THREE PILLARS */}
      <section className="px-6 md:px-12 lg:px-16 border-t border-samara-ivory/10 pt-24 md:pt-32">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif text-samara-ivory">
              The Samara <em className="italic text-samara-gold">Standard</em>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
            {[
              {
                title: 'Authentic Craftsmanship',
                desc: 'Every saree is handwoven by skilled artisans using traditional techniques passed down through generations.',
              },
              {
                title: 'Premium Quality',
                desc: 'We source only the finest materials and ensure rigorous quality standards at every step of the process.',
              },
              {
                title: 'Sustainable Practices',
                desc: 'Supporting local weaving communities and promoting eco-friendly, ethical production methods.',
              },
            ].map((value, i) => (
              <div key={i} className="text-center group">
                <div className="inline-flex items-center justify-center w-12 h-12 border border-samara-gold/30 rounded-full mb-6 group-hover:bg-samara-gold/5 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-samara-gold" />
                </div>
                <h3 className="font-serif text-xl text-samara-gold mb-4">{value.title}</h3>
                <p className="text-sm font-sans tracking-wide leading-relaxed text-samara-ivory/60">
                  {value.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
