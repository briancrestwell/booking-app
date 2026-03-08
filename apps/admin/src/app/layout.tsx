import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin', 'vietnamese'], variable: '--font-inter' });

export const metadata: Metadata = {
  title:       'POS Admin — Bánh Tráng Nhím',
  description: 'Quản lý bàn, đơn hàng, bếp — dành cho nhân viên nhà hàng.',
  manifest:    '/manifest.json',
};

export const viewport: Viewport = {
  themeColor:    '#0F1117',
  width:         'device-width',
  initialScale:  1,
  maximumScale:  1,
  userScalable:  false,
  viewportFit:   'cover',   // enable safe-area-inset-* on iPhone
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className="min-h-dvh bg-pos-bg antialiased">
        <Providers>
          {/* Phone-width container — centered on desktop, full-width on mobile */}
          <div className="relative mx-auto min-h-dvh max-w-md bg-pos-bg shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
