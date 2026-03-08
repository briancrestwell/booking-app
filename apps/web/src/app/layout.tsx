import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import MockBanner from '@/components/mock/MockBanner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Thực đơn & Đặt bàn',
  description: 'Gọi món, đặt bàn, thanh toán — tất cả trên điện thoại.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#1B6FEB',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className="min-h-dvh bg-background antialiased">
        <Providers>
          <div className="mx-auto max-w-md">
            {children}
          </div>
          <MockBanner />
        </Providers>
      </body>
    </html>
  );
}
