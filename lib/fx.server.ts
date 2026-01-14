import { createClient } from '@/lib/supabase/server';

export async function getLiveFxRate(currency: string): Promise<number> {
  if (!currency || currency === 'INR') return 1;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('currency_rates')
    .select('rate')
    .eq('base_currency', currency)
    .eq('target_currency', 'INR')
    .eq('enabled', true)
    .single();

  if (error || !data?.rate) {
    console.error(`FX rate missing for ${currency}`, error);
    return 1;
  }

  return Number(data.rate);
}
