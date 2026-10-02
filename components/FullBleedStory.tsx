import Link from 'next/link';

export function FullBleedStory() {
  return (
    <section className="relative py-32 md:py-48 bg-samara-void overflow-hidden flex items-center justify-center">
      {/* Container to give it that "almost full viewport" feel but not quite edge-to-edge if we want a border, 
          or we can make it truly full bleed edge to edge. The prompt says "Large image occupying most of the viewport". */}
      <div className="container mx-auto px-6 md:px-12 lg:px-16 relative z-10">
        <div className="relative w-full aspect-[4/5] md:aspect-[21/9] lg:aspect-[2.5/1] overflow-hidden group">
          
          {/* Background Image */}
          <div className="absolute inset-0 w-full h-full">
            {/* We'll use img_2599.jpeg as the story image */}
            <img 
              src="/img_2599.jpeg" 
              alt="Samara Heritage" 
              className="w-full h-full object-cover object-[center_30%] scale-105 group-hover:scale-100 transition-transform duration-[15000ms] ease-out"
            />
            {/* Vignette/Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-samara-void/40 md:bg-samara-void/20 group-hover:bg-samara-void/30 transition-colors duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-t from-samara-void/80 via-transparent to-transparent" />
          </div>

          {/* Typography positioned intentionally over the image */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 md:p-12">
            <span className="text-[10px] font-sans tracking-[0.4em] uppercase text-samara-gold mb-8 opacity-0 translate-y-4 animate-[fadeUp_1s_ease_forwards_0.2s]">
              Samara
            </span>
            <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl text-samara-ivory leading-[1.2] max-w-2xl opacity-0 translate-y-4 animate-[fadeUp_1s_ease_forwards_0.4s]">
              Woven from heritage,<br />
              <em className="italic font-light text-samara-gold">created for today.</em>
            </h2>
            
            <div className="mt-12 opacity-0 translate-y-4 animate-[fadeUp_1s_ease_forwards_0.6s]">
              <Link
                href="/about"
                className="inline-block border border-samara-ivory/30 px-8 py-3 text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory hover:border-samara-gold hover:bg-samara-gold hover:text-samara-void transition-all duration-300"
              >
                Explore Story
              </Link>
            </div>
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </section>
  );
}
