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
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="INR">INR ({CURRENCY_SYMBOLS.INR})</SelectItem>
        <SelectItem value="USD">USD ({CURRENCY_SYMBOLS.USD})</SelectItem>
        <SelectItem value="AED">AED ({CURRENCY_SYMBOLS.AED})</SelectItem>
      </SelectContent>
    </Select>
  );
}
