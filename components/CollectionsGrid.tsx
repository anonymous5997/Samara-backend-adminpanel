import Link from 'next/link';

const collections = [
  {
    name: 'Sarees',
    slug: 'sarees',
    desc: 'Timeless elegance in handcrafted silk',
    image: 'https://images.pexels.com/photos/3560137/pexels-photo-3560137.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    name: 'Co-ord Sets',
    slug: 'coord-sets',
    desc: 'Modern matching separates',
    image: 'https://images.pexels.com/photos/3560130/pexels-photo-3560130.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    name: 'Kurta Sets',
    slug: 'kurta-sets',
    desc: 'Elegant everyday essentials',
    image: 'https://images.pexels.com/photos/8533402/pexels-photo-8533402.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    name: 'Festive Edit',
    slug: 'festive-edit',
    desc: 'Celebration ready collections',
    image: 'https://images.pexels.com/photos/10214695/pexels-photo-10214695.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    name: 'Premium Edit',
    slug: 'premium-edit',
    desc: 'Exclusive luxury pieces',
    image: 'https://images.pexels.com/photos/3560137/pexels-photo-3560137.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
];

export function CollectionsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
      {collections.map((collection) => (
        <Link key={collection.slug} href={`/collections/${collection.slug}`}>
          <div className="group relative overflow-hidden rounded-lg border-2 border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-2xl hover:shadow-[#D4AF37]/30 transition-all duration-500 bg-[#0b0b0b] h-full">
            <div className="aspect-[4/5] overflow-hidden bg-[#111111] relative">
              <img
                src={collection.image}
                alt={collection.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

              <div className="absolute inset-0 flex items-center justify-center p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                <h3 className="font-serif text-2xl md:text-3xl font-bold text-[#D4AF37] text-center group-hover:scale-105 transition-transform duration-300">
                  {collection.name}
                </h3>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
