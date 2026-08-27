'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { TopNav } from '@/components/top-nav';

const publicRoutes = ['/login', '/signup', '/onboarding', '/auth'];

export function AppNavWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [authenticated, setAuthenticated] = useState(false);
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  useEffect(() => {
    if (isPublicRoute) { setAuthenticated(false); return; }
    void supabase.auth.getUser().then(({ data }) => setAuthenticated(Boolean(data.user)));
  }, [isPublicRoute, supabase]);

  if (isPublicRoute || !authenticated) return <>{children}</>;
  return <><TopNav /><div className="pb-20 md:pb-0">{children}</div><MobileBottomNav /></>;
}
