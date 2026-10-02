import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/*
 * Presentational building blocks for the commerce / account pages
 * (cart, wishlist, checkout, payment, orders, profile, track order).
 * Markup and class names only — no data, no state, no behaviour.
 */

/* ------------------------------------------------------------------ */
/* Class recipes                                                        */
/* ------------------------------------------------------------------ */

/** Square input on dark surfaces: hairline border, gold focus. Overrides components/ui/input defaults. */
export const FIELD =
  'h-12 w-full scroll-mt-[calc(var(--sm-header-h)+6rem)] rounded-none border border-samara-ivory/20 bg-samara-black/40 px-4 py-0 font-sans text-[0.9375rem] text-samara-ivory placeholder:text-samara-mute/70 ring-offset-0 transition-colors duration-300 hover:border-samara-ivory/40 focus:border-samara-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-samara-gold focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:border-samara-ivory/10 disabled:bg-transparent disabled:text-samara-mute disabled:opacity-100 [&:user-invalid]:border-[#D9806B]';

/** Square input on cream surfaces. */
export const FIELD_LIGHT =
  'h-12 w-full rounded-none border border-samara-cream-ink/25 bg-transparent px-4 py-0 font-sans text-sm uppercase tracking-[0.12em] text-samara-cream-ink placeholder:normal-case placeholder:tracking-normal placeholder:text-samara-cream-mute ring-offset-0 transition-colors duration-300 focus:border-samara-gold-deep focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-samara-gold-deep focus-visible:ring-offset-0';

/** Tracked uppercase label above a field. */
export const FIELD_LABEL =
  'mb-2.5 block font-sans text-[0.625rem] font-medium uppercase leading-none tracking-[0.24em] text-samara-mute';

/** Inline error text: shown by CSS only once the browser marks the preceding `peer` field invalid. */
export const FIELD_ERROR =
  'mt-2 hidden font-sans text-xs leading-snug text-[#D9806B] peer-[:user-invalid]:block';

export const BTN_GOLD = 'sm-btn bg-samara-gold text-samara-cream-ink hover:bg-samara-ivory';
export const BTN_GHOST = 'sm-btn sm-btn-ghost';
/** Solid button for cream panels. */
export const BTN_INK =
  'sm-btn bg-samara-cream-ink text-samara-cream hover:bg-samara-gold-deep focus-visible:!outline-samara-cream-ink';

export const FOCUS =
  'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-samara-gold';

/** Small tracked text link (e.g. "Continue shopping"). */
export const TEXT_LINK =
  'sm-link font-sans text-[0.6875rem] font-medium uppercase tracking-[0.22em] transition-colors duration-300';

/** react-select styles matching FIELD (square, hairline, gold focus, forest menu). */
export const samaraSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isDisabled ? 'transparent' : 'rgba(11, 17, 13, 0.4)',
    borderColor: state.isFocused ? '#C9A35F' : 'rgba(243, 235, 219, 0.2)',
    borderRadius: 0,
    boxShadow: state.isFocused ? '0 0 0 1px #C9A35F' : 'none',
    minHeight: '3rem',
    paddingLeft: '0.5rem',
    fontFamily: 'var(--font-sans-stack)',
    fontSize: '0.9375rem',
    cursor: 'pointer',
    opacity: state.isDisabled ? 0.6 : 1,
    '&:hover': { borderColor: state.isFocused ? '#C9A35F' : 'rgba(243, 235, 219, 0.4)' },
  }),
  menu: (base: any) => ({
    ...base,
    backgroundColor: '#17221A',
    border: '1px solid rgba(243, 235, 219, 0.14)',
    borderRadius: 0,
    boxShadow: 'none',
    marginTop: 4,
    zIndex: 50,
  }),
  menuList: (base: any) => ({ ...base, paddingTop: 0, paddingBottom: 0 }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected ? '#22362A' : state.isFocused ? '#1B2A1F' : 'transparent',
    color: state.isSelected ? '#C9A35F' : '#F3EBDB',
    fontFamily: 'var(--font-sans-stack)',
    fontSize: '0.875rem',
    cursor: 'pointer',
    '&:active': { backgroundColor: '#22362A' },
  }),
  singleValue: (base: any) => ({ ...base, color: '#F3EBDB' }),
  input: (base: any) => ({ ...base, color: '#F3EBDB' }),
  placeholder: (base: any) => ({ ...base, color: 'rgba(168, 162, 144, 0.8)' }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (base: any, state: any) => ({
    ...base,
    color: state.isFocused ? '#C9A35F' : '#A8A290',
    '&:hover': { color: '#C9A35F' },
  }),
};

/* ------------------------------------------------------------------ */
/* Page hero band                                                       */
/* ------------------------------------------------------------------ */

export function Eyebrow({ children, className, line = true }: { children: ReactNode; className?: string; line?: boolean }) {
  return (
    <p className={cn('sm-eyebrow flex items-center gap-4 text-samara-gold', className)}>
      <span>{children}</span>
      {line && <span aria-hidden className="h-px w-10 bg-samara-gold/50" />}
    </p>
  );
}

interface AccountHeroProps {
  eyebrow: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  /** Right-hand slot (counts, links). */
  aside?: ReactNode;
  className?: string;
  titleClassName?: string;
}

/** Editorial header: eyebrow, large serif title with italic accent, one muted line. */
export function AccountHero({ eyebrow, title, intro, aside, className, titleClassName }: AccountHeroProps) {
  return (
    <header className={cn('border-b border-samara-line', className)}>
      <div className="sm-container flex flex-col gap-8 pb-10 pt-12 md:flex-row md:items-end md:justify-between md:pb-14 md:pt-20 lg:pt-24">
        <div className="min-w-0">
          <Eyebrow className="sm-anim-fade-up">{eyebrow}</Eyebrow>
          <h1 className={cn('sm-display-l sm-anim-fade-up mt-6 font-light [--anim-delay:80ms]', titleClassName)}>{title}</h1>
          {intro && <p className="sm-body sm-anim-fade-up mt-5 max-w-[46ch] [--anim-delay:160ms]">{intro}</p>}
        </div>
        {aside && <div className="sm-anim-fade-up shrink-0 [--anim-delay:200ms]">{aside}</div>}
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Numbered section heading (checkout steps, profile sections)          */
/* ------------------------------------------------------------------ */

export function StepHeading({
  n,
  title,
  note,
  className,
  as: Tag = 'h2',
}: {
  n: string;
  title: ReactNode;
  note?: ReactNode;
  className?: string;
  as?: 'h2' | 'h3';
}) {
  return (
    <div className={cn('flex items-baseline gap-5 border-b border-samara-line pb-5', className)}>
      <span aria-hidden className="font-sans text-[0.6875rem] font-medium tabular-nums tracking-[0.18em] text-samara-gold">
        {n}
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <Tag className="font-serif text-[1.625rem] font-light leading-tight text-samara-ivory md:text-[1.875rem]">{title}</Tag>
        {note && <p className="font-sans text-xs text-samara-mute">{note}</p>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small uppercase status tag                                           */
/* ------------------------------------------------------------------ */

export type TagTone = 'gold' | 'ivory' | 'mute' | 'warn';

const TAG_TONES: Record<TagTone, string> = {
  gold: 'border-samara-gold/60 text-samara-gold',
  ivory: 'border-samara-ivory/40 text-samara-ivory',
  mute: 'border-samara-ivory/20 text-samara-mute',
  warn: 'border-[#D9806B]/60 text-[#D9806B]',
};

export function StatusTag({ children, tone = 'mute', className }: { children: ReactNode; tone?: TagTone; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center whitespace-nowrap border px-2.5 font-sans text-[0.625rem] font-medium uppercase leading-none tracking-[0.2em]',
        TAG_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Label / value pair used in detail lists. */
export function Detail({ label, children, className }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="font-sans text-[0.625rem] font-medium uppercase tracking-[0.24em] text-samara-mute">{label}</dt>
      <dd className="mt-2 font-sans text-[0.9375rem] leading-relaxed text-samara-ivory">{children}</dd>
    </div>
  );
}
