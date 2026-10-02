'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

/* ======================================================
   TYPES
====================================================== */

export type CurrencyCode = 'INR' | 'USD' | 'AED' | 'CAD' | 'GBP';

type CurrencyOption = {
  code: CurrencyCode;
  label: string;
  symbol: string;
};

interface CurrencySelectorProps {
  currency: CurrencyCode;
  onChange?: (currency: CurrencyCode) => void;
  /** "compact" = flag + code (header); default also shows the symbol. */
  variant?: 'default' | 'compact';
  /** Which side the dropdown aligns to. */
  align?: 'left' | 'right';
  /** Open below (default) or above the trigger (e.g. at the bottom of a menu). */
  placement?: 'down' | 'up';
}

/* ======================================================
   DATA
====================================================== */

const OPTIONS: CurrencyOption[] = [
  { code: 'INR', label: 'India', symbol: '₹' },
  { code: 'USD', label: 'United States', symbol: '$' },
  { code: 'AED', label: 'United Arab Emirates', symbol: 'د.إ' },
  { code: 'CAD', label: 'Canada', symbol: 'C$' },
  { code: 'GBP', label: 'United Kingdom', symbol: '£' },
];

/* ======================================================
   FLAGS — inline SVG (emoji flags render as letters on Windows)
====================================================== */

function Flag({ code, className = '' }: { code: CurrencyCode; className?: string }) {
  const common = {
    viewBox: '0 0 30 20',
    className: `block h-[14px] w-[21px] flex-shrink-0 ring-1 ring-black/20 ${className}`,
    'aria-hidden': true,
    preserveAspectRatio: 'none' as const,
  };
  switch (code) {
    case 'INR':
      return (
        <svg {...common}>
          <rect width="30" height="20" fill="#fff" />
          <rect width="30" height="6.67" fill="#FF9933" />
          <rect y="13.33" width="30" height="6.67" fill="#138808" />
          <circle cx="15" cy="10" r="2.5" fill="none" stroke="#000080" strokeWidth="0.7" />
          <circle cx="15" cy="10" r="0.6" fill="#000080" />
        </svg>
      );
    case 'USD':
      return (
        <svg {...common}>
          <rect width="30" height="20" fill="#fff" />
          {[0, 2, 4, 6, 8, 10, 12].map((i) => (
            <rect key={i} y={(i * 20) / 13} width="30" height={20 / 13} fill="#B22234" />
          ))}
          <rect width="12" height={(7 * 20) / 13} fill="#3C3B6E" />
          {[2, 5, 8].map((x) =>
            [2, 5, 8].map((y) => <circle key={`${x}-${y}`} cx={x + 0.5} cy={y * 0.95} r="0.55" fill="#fff" />),
          )}
        </svg>
      );
    case 'AED':
      return (
        <svg {...common}>
          <rect width="30" height="6.67" fill="#00732F" />
          <rect y="6.67" width="30" height="6.67" fill="#fff" />
          <rect y="13.33" width="30" height="6.67" fill="#000" />
          <rect width="8" height="20" fill="#FF0000" />
        </svg>
      );
    case 'CAD':
      return (
        <svg {...common}>
          <rect width="30" height="20" fill="#fff" />
          <rect width="7.5" height="20" fill="#D52B1E" />
          <rect x="22.5" width="7.5" height="20" fill="#D52B1E" />
          <path
            fill="#D52B1E"
            d="M15 3.6l1 2 1.4-.6-.4 3 1.6-1.3.4 1 1.6-.3-.6 1.7 1 .6-3 2.3.3 1.2-2.9-.4V16h-.8v-3.2l-2.9.4.3-1.2-3-2.3 1-.6-.6-1.7 1.6.3.4-1 1.6 1.3-.4-3 1.4.6z"
          />
        </svg>
      );
    case 'GBP':
      return (
        <svg {...common} viewBox="0 0 60 30">
          <clipPath id="gb-clip">
            <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
          </clipPath>
          <rect width="60" height="30" fill="#012169" />
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
          <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#gb-clip)" stroke="#C8102E" strokeWidth="4" />
          <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
          <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
        </svg>
      );
  }
}

/* ======================================================
   COMPONENT
====================================================== */

export default function CurrencySelector({
  currency,
  onChange,
  variant = 'default',
  align = 'right',
  placement = 'down',
}: CurrencySelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = OPTIONS.find((opt) => opt.code === currency) ?? OPTIONS[0];

  /* Close on outside click / Escape */
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Currency: ${current.code} (${current.label})`}
        className="inline-flex h-11 items-center gap-2 px-2 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-samara-ivory transition-opacity hover:opacity-75 focus-visible:outline focus-visible:outline-1 focus-visible:outline-samara-gold"
      >
        <Flag code={current.code} />
        <span>{current.code}</span>
        {variant === 'default' && (
          <span className="normal-case tracking-normal text-samara-ivory/60">{current.symbol}</span>
        )}
        <ChevronDown
          aria-hidden
          strokeWidth={1.25}
          className={`h-3 w-3 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Choose currency"
          className={`absolute z-[1200] w-64 border border-samara-line bg-samara-ink py-1.5 ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${placement === 'up' ? 'bottom-full mb-1' : 'mt-1'}`}
        >
          {OPTIONS.map((opt) => {
            const selected = opt.code === currency;
            return (
              <li key={opt.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => {
                    onChange?.(opt.code);
                    setOpen(false);
                  }}
                  className={`flex min-h-[44px] w-full items-center gap-3 px-4 text-left font-sans text-xs transition-colors hover:bg-samara-char ${
                    selected ? 'text-samara-ivory' : 'text-samara-ivory/75'
                  }`}
                >
                  <Flag code={opt.code} />
                  <span className="w-9 font-medium tracking-[0.12em]">{opt.code}</span>
                  <span className="flex-1 truncate text-samara-mute">{opt.label}</span>
                  <span className="text-samara-ivory/60">{opt.symbol}</span>
                  {selected ? (
                    <Check aria-hidden strokeWidth={1.5} className="h-3.5 w-3.5 text-samara-gold" />
                  ) : (
                    <span className="w-3.5" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
