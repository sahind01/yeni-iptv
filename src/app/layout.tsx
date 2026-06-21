import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import InstallPrompt from '@/components/PWA/InstallPrompt';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mutlu Player - Premium IPTV',
  description: 'Mutlu Player - En iyi IPTV deneyimi',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-512.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Mutlu Player',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <head>
        <meta name="application-name" content="Mutlu Player" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Mutlu Player" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#0a0a0a" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" href="/icons/icon-512.png" />
      </head>
      <body className="min-h-screen bg-[#0a0a0a]">
        <InstallPrompt />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1a1a1a',
              color: '#fff',
              borderRadius: '12px',
              border: '1px solid #333',
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
