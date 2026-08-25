import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Browser-safe Supabase client. This deliberately uses only the public anon key;
 * privileged service-role access is confined to server.ts.
 */
export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  return createClient<Database>(url, anonKey);
}
