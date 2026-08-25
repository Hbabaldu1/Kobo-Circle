import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * Browser-safe Supabase client. This deliberately uses only the public anon key;
 * privileged service-role access is confined to server.ts.
 */
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase'; // or your database type location

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createBrowserClient<Database>(url, anonKey);
}
