// components/currency-selector.tsx
'use client';

import React, { useState } from 'react';

export type CurrencyOption = {
  code: 'INR' | 'USD' | 'AED';
  label: string;
  symbol: string;
  flag: string; // emoji flag
};

/**
 * Props:
 *  - currency: current currency code
 *  - onChange: callback when user picks a new currency
 */
export function CurrencySelector({
  currency,
  onChange,
}: {
  currency: CurrencyOption['code'];
  onChange: (c: CurrencyOption['code']) => void;
}) {
  const options: CurrencyOption[] = [
    { code: 'INR', label: 'India', symbol: '₹', flag: '🇮🇳' },
    { code: 'USD', label: 'United States', symbol: '$', flag: '🇺🇸' },
    { code: 'AED', label: 'UAE', symbol: 'د.إ', flag: '🇦🇪' },
  ];

  const [open, setOpen] = useState(false);

  const current = options.find((o) => o.code === currency) || options[0];

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium bg-black/30 border border-[#D4AF37]/20 hover:bg-black/40 transition"
      >
        <span className="text-xl leading-none">{current.flag}</span>
        <span className="min-w-[48px] text-left">
          <span className="font-semibold mr-1">{current.code}</span>
          <span className="text-xs text-gray-300">{current.symbol}</span>
        </span>
        <svg
          className={`w-4 h-4 ml-1 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="none"
        >
          <path d="M6 7l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="currency-menu"
          className="absolute right-0 mt-2 w-44 bg-[#0b0b0b] border border-[#D4AF37]/20 rounded-lg shadow-2xl z-50 overflow-hidden"
        >
          <ul className="py-1">
            {options.map((opt) => (
              <li key={opt.code}>
                <button
                  onClick={() => {
                    onChange(opt.code);
                    setOpen(false);
                  }}
                  className={
                    'w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-[#111] transition-colors ' +
                    (opt.code === currency ? 'bg-[#111] font-semibold' : 'text-gray-200')
                  }
                  role="menuitem"
                >
                  <span className="text-lg">{opt.flag}</span>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between">
                      <span>{opt.code} <span className="text-xs text-gray-400 ml-2">{opt.label}</span></span>
                      <span className="ml-2 text-sm text-gray-300">{opt.symbol}</span>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CurrencySelector;
