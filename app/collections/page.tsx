import Link from 'next/link';

const collectionsData = [
  {
    name: 'Silk Sarees',
    slug: 'silk-sarees',
    description: 'Luxurious pure silk sarees with timeless elegance',
    image: 'https://images.pexels.com/photos/3560137/pexels-photo-3560137.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    name: 'Cotton Sarees',
    slug: 'cotton-sarees',
    description: 'Comfortable everyday cotton sarees for effortless style',
    image: 'https://images.pexels.com/photos/3560130/pexels-photo-3560130.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    name: 'Organza Edit',
    slug: 'organza-edit',
    description: 'Lightweight and graceful organza sarees',
    image: 'https://images.pexels.com/photos/8533402/pexels-photo-8533402.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    name: 'Embroidered Edit',
    slug: 'embroidered-edit',
    description: 'Intricate embroidery work on premium fabrics',
    image: 'https://images.pexels.com/photos/10214695/pexels-photo-10214695.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    name: 'Banarasi Collection',
    slug: 'banarasi-collection',
    description: 'Traditional Banarasi weaves with rich heritage',
    image: 'https://images.pexels.com/photos/3560137/pexels-photo-3560137.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    name: 'Premium Handloom',
    slug: 'premium-handloom',
    description: 'Exclusive handloom sarees from master weavers',
    image: 'https://images.pexels.com/photos/3560130/pexels-photo-3560130.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
];

export default function CollectionsPage() {
  return (
    <div className="bg-black text-white min-h-screen">
      <section className="py-16 md:py-20 bg-gradient-to-b from-black to-[#0b0b0b] border-b border-[#D4AF37]/10">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F4D03F] to-[#D4AF37] tracking-tighter">
              Collections
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
              Signature edits from Samara
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {collectionsData.map((collection) => (
              <Link key={collection.slug} href={`/collections/${collection.slug}`}>
                <div className="group relative overflow-hidden rounded-2xl border-2 border-[#D4AF37]/20 hover:border-[#D4AF37]/70 hover:shadow-2xl hover:shadow-[#D4AF37]/30 transition-all duration-500 bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] h-full hover:-translate-y-1">
                  <div className="aspect-[3/4] flex flex-col items-center justify-center p-8 space-y-4">
                    <h2 className="font-serif text-2xl md:text-3xl font-semibold text-[#D4AF37] text-center group-hover:text-[#F4D03F] transition-colors duration-300">
                      {collection.name}
                    </h2>
                    <p className="text-sm text-gray-400 text-center leading-relaxed">
                      {collection.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
