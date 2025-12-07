import Link from 'next/link';

const collections = [
  {
    name: 'Sarees',
    slug: 'sarees',
  },
  {
    name: 'Co-ord Sets',
    slug: 'coord-sets',
  },
  {
    name: 'Kurta Sets',
    slug: 'kurta-sets',
  },
  {
    name: 'Festive Edit',
    slug: 'festive-edit',
  },
  {
    name: 'Premium Edit',
    slug: 'premium-edit',
  },
];

export function CollectionsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
      {collections.map((collection) => (
        <Link key={collection.slug} href={`/collections/${collection.slug}`}>
          <div className="group relative overflow-hidden rounded-2xl border-2 border-[#D4AF37]/20 hover:border-[#D4AF37]/70 hover:shadow-2xl hover:shadow-[#D4AF37]/30 transition-all duration-500 bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] h-full hover:-translate-y-1">
            <div className="aspect-[3/4] flex items-center justify-center p-6">
              <h3 className="font-serif text-xl md:text-2xl font-semibold text-[#D4AF37] text-center group-hover:text-[#F4D03F] transition-colors duration-300">
                {collection.name}
              </h3>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
