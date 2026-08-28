// // components/app-nav-wrapper.tsx
// 'use client';

// import { useEffect, useMemo, useState } from 'react';
// import { usePathname } from 'next/navigation';
// import { createClient } from '@/lib/supabase/client';
// import { MobileBottomNav } from '@/components/mobile-bottom-nav';
// import { TopNav } from '@/components/top-nav';

// const publicRoutes = ['/', '/login', '/signup', '/check-email', '/onboarding', '/auth'];

// interface AppNavWrapperProps {
//   children: React.ReactNode;
//   initialAuthenticated?: boolean;
// }

// export function AppNavWrapper({ children, initialAuthenticated = false }: AppNavWrapperProps) {
//   const pathname = usePathname();
//   const supabase = useMemo(() => createClient(), []);
//   const [authenticated, setAuthenticated] = useState(initialAuthenticated);
//   const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
//   const isDirectChat = pathname.startsWith('/messages/') && pathname !== '/messages';

//   useEffect(() => {
//     setAuthenticated(initialAuthenticated);

//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange((_event, session) => {
//       setAuthenticated(Boolean(session?.user));
//     });

//     return () => subscription.unsubscribe();
//   }, [initialAuthenticated, isPublicRoute, supabase]);

//   if (isPublicRoute || !authenticated) return <>{children}</>;

//   return (
//     <>
//       <TopNav />
//       <div className={isDirectChat ? '' : 'pb-20 md:pb-0'}>{children}</div>
//       <MobileBottomNav />
//     </>
//   );
// }




'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Home, MessageSquare, PlusSquare, Search } from 'lucide-react';

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 h-16 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
        
        {/* Brand Logo */}
        <Link href="/feed" className="text-xl font-bold text-blue-600">
          Kobo Circle
        </Link>

        {/* Search Bar */}
        <div className="relative hidden w-72 sm:block">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Kobo Circle"
            className="w-full rounded-full border border-slate-200 bg-slate-100 pl-9 pr-4 py-1.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Action Links with Lucide Icons */}
        <div className="flex items-center gap-6">
          <Link
            href="/feed"
            className={`flex items-center gap-1.5 text-sm font-medium ${
              pathname === '/feed' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Feed</span>
          </Link>

          <Link
            href="/messages"
            className={`flex items-center gap-1.5 text-sm font-medium ${
              pathname.startsWith('/messages') ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Messages</span>
          </Link>

          <Link
            href="/new-listing"
            className={`flex items-center gap-1.5 text-sm font-medium ${
              pathname === '/new-listing' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Post</span>
          </Link>

          <button
            aria-label="Notifications"
            className="text-slate-600 hover:text-slate-900"
          >
            <Bell className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
