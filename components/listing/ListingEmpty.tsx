import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'solid' | 'ghost';
}

interface ListingEmptyProps {
  eyebrow?: string;
  title: ReactNode;
  body?: ReactNode;
  actions?: EmptyAction[];
  className?: string;
}

const BTN = {
  solid: 'sm-btn whitespace-nowrap px-6 sm:px-8 bg-samara-gold text-samara-cream-ink hover:bg-samara-ivory',
  ghost: 'sm-btn sm-btn-ghost whitespace-nowrap px-6 sm:px-8',
} as const;

/**
 * Quiet editorial empty / loading state: a fine arch outline as the only
 * ornament, a serif line and up to two square buttons.
 */
export function ListingEmpty({ eyebrow, title, body, actions = [], className }: ListingEmptyProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center overflow-hidden border-y border-samara-line px-6 py-16 text-center md:py-24',
        className,
      )}
    >
      <span
        aria-hidden
        className="mb-8 block h-20 w-14 rounded-t-[999px] border border-samara-gold/40 md:h-24 md:w-16"
      >
        <span className="m-[5px] block h-[calc(100%-10px)] rounded-t-[999px] border border-samara-gold/[0.15]" />
      </span>
      {eyebrow && <p className="sm-eyebrow mb-4 text-samara-gold">{eyebrow}</p>}
      <p className="max-w-xl font-serif text-[clamp(1.75rem,3.4vw,2.75rem)] font-light leading-tight text-samara-ivory">
        {title}
      </p>
      {body && <p className="sm-body mt-4 max-w-md">{body}</p>}
      {actions.length > 0 && (
        <div className="mt-10 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row">
          {actions.map((a) => {
            const cls = BTN[a.variant ?? 'solid'];
            const inner = (
              <>
                {a.label}
                <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.25} />
              </>
            );
            return a.href ? (
              <Link key={a.label} href={a.href} className={cls}>
                {inner}
              </Link>
            ) : (
              <button key={a.label} type="button" onClick={a.onClick} className={cls}>
                {inner}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Placeholder grid shown while products load. */
export function ListingSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div aria-hidden className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="aspect-[4/5] w-full animate-pulse bg-samara-forest-2/60 motion-reduce:animate-none" />
          <div className="mt-4 h-3 w-8 bg-samara-forest-2/60" />
          <div className="mt-3 h-4 w-3/4 bg-samara-forest-2/60" />
          <div className="mt-3 h-3 w-16 bg-samara-forest-2/60" />
        </div>
      ))}
    </div>
  );
}
