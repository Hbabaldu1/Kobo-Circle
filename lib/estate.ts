import 'server-only';
import { unstable_cache } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const getSeededEstate = unstable_cache(
  async () => {
    const supabase = createServerSupabaseClient();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('estates')
      .select('name, city')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error('Could not load the seeded estate.', error.message);
      return null;
    }
    return data;
  },
  ['seeded-estate'],
  { revalidate: 300 },
);
