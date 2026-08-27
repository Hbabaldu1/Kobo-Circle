import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { createAuthServerClient } from '@/lib/supabase/server'; // Adjusted import to resolve createAuthServerClient
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { TopNav } from '@/components/top-nav';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk', display: 'swap' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'Kobo Circle',
  description: 'A hyperlocal marketplace for your estate.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-192.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kobo Circle',
  },
};

export const viewport: Viewport = {
  themeColor: '#4A2E2B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans ${user ? 'pb-16 md:pb-0' : 'pb-0'}`}>
        {user && <TopNav user={user} />}
        <main>{children}</main>
        {user && <MobileBottomNav />}
      </body>
    </html>
  );
}
