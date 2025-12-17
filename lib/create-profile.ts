import { supabase } from '@/lib/supabase/client';

export async function ensureProfile(user: any) {
  if (!user) return;

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (existing) return;

  await supabase.from('profiles').insert({
    id: user.id,
    email: user.email,
    phone: user.phone ?? null,
    name: user.user_metadata?.name ?? '',
    created_at: new Date().toISOString(),
  });
}
