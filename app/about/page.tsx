export default function AboutPage() {
  return (
    <div className="bg-black text-white min-h-screen">
      <section className="relative py-24 bg-gradient-to-b from-black to-luxury-charcoal">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-serif text-6xl md:text-7xl font-bold mb-8 text-gold tracking-tighter text-center">
              About Samara
            </h1>
            <p className="text-xl text-gray-400 text-center mb-16 leading-relaxed">
              Where heritage meets modern elegance
            </p>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
              <div>
                <div className="aspect-[4/5] bg-gradient-to-br from-luxury-charcoal to-black rounded-lg border-2 border-gold/20 flex items-center justify-center">
                  <p className="text-gray-600 font-serif text-lg">Brand Image</p>
                </div>
              </div>
              <div className="space-y-6">
                <h2 className="font-serif text-3xl font-bold text-gold tracking-luxury">
                  Woven Luxury
                </h2>
                <p className="text-gray-400 leading-relaxed">
                  At Samara, we celebrate the timeless art of saree weaving. Each piece in our collection
                  is a testament to generations of skilled craftsmanship, meticulously handwoven by master
                  artisans who pour their heritage into every thread.
                </p>
                <p className="text-gray-400 leading-relaxed">
                  Our sarees are more than garments they are wearable art, designed to make every woman
                  feel like royalty. From the lustrous silks of Banaras to the delicate cottons of Bengal,
                  we bring you the finest textiles India has to offer.
                </p>
              </div>
            </div>

            <div className="bg-luxury-charcoal rounded-lg p-8 md:p-12 border border-gold/20 mb-20">
              <h2 className="font-serif text-3xl font-bold text-gold tracking-luxury mb-6 text-center">
                Indian Heritage, Modern Elegance
              </h2>
              <p className="text-gray-400 leading-relaxed mb-6">
                Founded on the belief that tradition and modernity can coexist beautifully, Samara bridges
                the gap between classical Indian textiles and contemporary fashion sensibilities. We work
                directly with weavers and artisan communities across India, ensuring fair compensation and
                preserving ancient weaving techniques for future generations.
              </p>
              <p className="text-gray-400 leading-relaxed">
                Each Samara saree tells a story of dedication, skill, and passion. Whether you're looking
                for everyday elegance or showstopping festive wear, our curated collections offer something
                special for every occasion and every woman.
              </p>
            </div>

            <div className="text-center">
              <h2 className="font-serif text-3xl font-bold text-gold tracking-luxury mb-6">
                For The Modern Woman
              </h2>
              <p className="text-gray-400 leading-relaxed max-w-3xl mx-auto mb-8">
                Today's Samara woman is confident, discerning, and appreciates quality. She values
                authenticity and seeks pieces that resonate with her personal style while honoring
                tradition. We design with her in mindcurating collections that blend heritage with
                contemporary aesthetics, making it easy to embrace the beauty of Indian handlooms
                in everyday life.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-luxury-charcoal border-t border-gold/20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: 'Authentic Craftsmanship',
                desc: 'Every saree is handwoven by skilled artisans using traditional techniques',
              },
              {
                title: 'Premium Quality',
                desc: 'We source only the finest materials and ensure rigorous quality standards',
              },
              {
                title: 'Sustainable Fashion',
                desc: 'Supporting local communities and eco-friendly production practices',
              },
            ].map((value, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold/10 mb-4">
                  <div className="w-2 h-2 rounded-full bg-gold" />
                </div>
                <h3 className="font-serif text-xl font-bold text-gold mb-3">{value.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
