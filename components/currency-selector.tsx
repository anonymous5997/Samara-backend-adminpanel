'use client';

import React, { useState, useRef, useEffect } from 'react';

/* ======================================================
   TYPES
====================================================== */

export type CurrencyCode = 'INR' | 'USD' | 'AED' | 'CAD' | 'GBP';

type CurrencyOption = {
  code: CurrencyCode;
  label: string;
  symbol: string;
  flag: string;
};

interface CurrencySelectorProps {
  currency: CurrencyCode;
  onChange?: (currency: CurrencyCode) => void;
}

/* ======================================================
   DATA
====================================================== */

const OPTIONS: CurrencyOption[] = [
  { code: 'INR', label: 'India', symbol: '₹', flag: '🇮🇳' },
  { code: 'USD', label: 'United States', symbol: '$', flag: '🇺🇸' },
  { code: 'AED', label: 'UAE', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'CAD', label: 'Canada', symbol: 'C$', flag: '🇨🇦' },
  { code: 'GBP', label: 'United Kingdom', symbol: '£', flag: '🇬🇧' },
];

/* ======================================================
   COMPONENT
====================================================== */

export default function CurrencySelector({
  currency,
  onChange,
}: CurrencySelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current =
    OPTIONS.find((opt) => opt.code === currency) ?? OPTIONS[0];

  /* ------------------------------------------------------
     Close dropdown on outside click
  ------------------------------------------------------ */
  useEffect(() => {
    function handleClickOutside(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('pointerdown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [open]);

  /* ------------------------------------------------------
     Render
  ------------------------------------------------------ */
  return (
    <div ref={ref} className="relative inline-block text-left">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full px-3 py-1
                   text-sm font-medium bg-black/40 border border-[#D4AF37]/30
                   hover:bg-black/50 transition"
      >
        <span className="text-lg leading-none">{current.flag}</span>

        <span className="flex items-baseline gap-1">
          <span className="font-semibold">{current.code}</span>
          <span className="text-xs text-gray-300">{current.symbol}</span>
        </span>

        <svg
          className={`w-4 h-4 ml-1 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M6 7l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-52 z-50 rounded-lg
                     bg-[#0b0b0b] border border-[#D4AF37]/20 shadow-2xl"
        >
          <ul className="py-1">
            {OPTIONS.map((opt) => (
              <li key={opt.code}>
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => {
                      onChange?.(opt.code);
                      setOpen(false);
                  }}
                  className={`w-full px-3 py-2 flex items-center gap-3
                              hover:bg-[#111] transition-colors text-left
                              ${
                                opt.code === currency
                                  ? 'bg-[#111] font-semibold'
                                  : 'text-gray-200'
                              }`}
                >
                  <span className="text-lg">{opt.flag}</span>

                  <span className="flex-1">
                    {opt.code}
                    <span className="ml-2 text-xs text-gray-400">
                      {opt.label}
                    </span>
                  </span>

                  <span className="text-sm text-gray-300">
                    {opt.symbol}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
