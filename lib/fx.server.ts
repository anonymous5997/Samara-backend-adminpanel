import { supabase } from '@/lib/supabase/server';

export async function getLiveFxRate(currency: string): Promise<number> {
  if (!currency || currency === 'INR') return 1;

  const { data, error } = await supabase
    .from('currency_rates')
    .select('rate')
    .eq('currency', currency)
    .single();

  if (error || !data?.rate) {
    console.error(`FX rate missing for ${currency}`);
    return 1; // safe fallback
  }

  return Number(data.rate);
}
