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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {collectionsData.map((collection) => (
              <Link key={collection.slug} href={`/collections/${collection.slug}`}>
                <div className="group relative overflow-hidden rounded-lg border-2 border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-2xl hover:shadow-[#D4AF37]/30 transition-all duration-500 bg-[#0b0b0b] h-full">
                  <div className="aspect-[4/5] overflow-hidden bg-[#111111] relative">
                    <img
                      src={collection.image}
                      alt={collection.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-70 group-hover:opacity-50 transition-opacity duration-500" />

                    <div className="absolute inset-0 flex items-center justify-center p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                      <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#D4AF37] text-center group-hover:scale-105 transition-transform duration-300">
                        {collection.name}
                      </h2>
                    </div>
                  </div>
                  <div className="p-6 bg-gradient-to-b from-[#0b0b0b] to-black">
                    <p className="text-gray-400 text-center leading-relaxed">
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
