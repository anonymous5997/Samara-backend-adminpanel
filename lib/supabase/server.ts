import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Server Supabase client factory (for RSC, API routes, admin queries)
 */
export function createClient() {
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false
    }
  });
}

/**
 * Singleton admin server client (for analytics, cron, jobs)
 */
export const supabaseServer = createClient();
