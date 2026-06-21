import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import InstallPrompt from '@/components/PWA/InstallPrompt';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mutlu Player - Premium IPTV',
  description: 'Mutlu Player - En iyi IPTV deneyimi',
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
