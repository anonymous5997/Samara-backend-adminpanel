'use client';

export function Marquee() {
  const text = "HANDCRAFTED HERITAGE  •  TIMELESS ELEGANCE  •  WOVEN FOR EVERY WOMAN  •  TRADITION MEETS TOMORROW  •  ";
  return (
    <div className="relative overflow-hidden py-6 md:py-8 bg-samara-void border-b border-samara-gold/10 flex items-center group">
      <div className="flex whitespace-nowrap animate-[marquee_30s_linear_infinite] group-hover:![animation-play-state:paused]">
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            key={i}
            className="text-[10px] md:text-xs font-sans tracking-[0.4em] uppercase text-samara-gold/80 px-8"
          >
            {text}
          </span>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}} />
    </div>
  );
}
