import Link from 'next/link';

const collections = [
  {
    name: 'Silk Sarees',
    slug: 'silk-sarees',
    desc: 'Timeless elegance in pure silk',
    image: 'https://images.pexels.com/photos/3560137/pexels-photo-3560137.jpeg?auto=compress&cs=tinysrgb&w=800',
    badge: 'Bestseller',
  },
  {
    name: 'Cotton Sarees',
    slug: 'cotton-sarees',
    desc: 'Everyday luxury & comfort',
    image: 'https://images.pexels.com/photos/3560130/pexels-photo-3560130.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    name: 'Festive Edit',
    slug: 'festive-edit',
    desc: 'Celebration ready styles',
    image: 'https://images.pexels.com/photos/10214695/pexels-photo-10214695.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
];

export function CollectionsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
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

              {collection.badge && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-[#D4AF37]/50 z-10">
                  {collection.badge}
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                <h3 className="font-serif text-3xl font-bold text-[#D4AF37] mb-2 group-hover:scale-105 transition-transform duration-300">
                  {collection.name}
                </h3>
                <p className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                  {collection.desc}
                </p>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
