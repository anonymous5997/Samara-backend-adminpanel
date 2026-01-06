import { supabase } from '@/lib/supabase/client';

export type CurrencyRate = {
  base_currency: string;
  target_currency: string;
  rate: number;
};

export async function getCurrencyRates(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('currency_rates')
    .select('target_currency, rate')
    .eq('base_currency', 'INR')
    .eq('enabled', true);

  if (error || !data) {
    console.error('Currency rate fetch failed', error);
    return { INR: 1 };
  }

  const map: Record<string, number> = { INR: 1 };

  for (const row of data) {
    map[row.target_currency] = Number(row.rate);
  }

  return map;
}
