'use client';

import { Currency } from '@/lib/types';
import { CURRENCY_SYMBOLS } from '@/lib/currency';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CurrencySelectorProps {
  currency: Currency;
  onChange: (currency: Currency) => void;
}

export function CurrencySelector({ currency, onChange }: CurrencySelectorProps) {
  return (
    <Select value={currency} onValueChange={(value) => onChange(value as Currency)}>
      <SelectTrigger className="w-32 bg-transparent border-[#D4AF37]/30 text-[#D4AF37] hover:border-[#D4AF37] focus:ring-[#D4AF37]/50">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-[#111111] border-[#D4AF37]/20">
        <SelectItem value="INR" className="text-[#F5F5F5] hover:text-[#D4AF37] focus:text-[#D4AF37] focus:bg-[#D4AF37]/10">INR ({CURRENCY_SYMBOLS.INR})</SelectItem>
        <SelectItem value="USD" className="text-[#F5F5F5] hover:text-[#D4AF37] focus:text-[#D4AF37] focus:bg-[#D4AF37]/10">USD ({CURRENCY_SYMBOLS.USD})</SelectItem>
        <SelectItem value="AED" className="text-[#F5F5F5] hover:text-[#D4AF37] focus:text-[#D4AF37] focus:bg-[#D4AF37]/10">AED ({CURRENCY_SYMBOLS.AED})</SelectItem>
      </SelectContent>
    </Select>
  );
}
