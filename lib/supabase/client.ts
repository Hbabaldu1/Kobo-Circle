import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Browser-safe Supabase client. This deliberately uses only the public anon key;
 * privileged service-role access is confined to server.ts.
 */
export function createClient(): SupabaseClient<Database, 'public'> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createBrowserClient<Database>(url, anonKey) as unknown as SupabaseClient<Database, 'public'>;
}
