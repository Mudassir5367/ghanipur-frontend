import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'Ghanipur — Dairy Management & Marketplace',
    template: '%s | Ghanipur',
  },
  description:
    'Ghanipur is a multi-shop dairy platform: manage milk, yogurt, ghee, sales, customers, credit ledgers and deliveries — and sell online.',
  icons: { icon: '/logo.jpeg', apple: '/logo.jpeg' },
  openGraph: {
    title: 'Ghanipur',
    description: 'Multi-shop dairy management & marketplace.',
    url: appUrl,
    siteName: 'Ghanipur',
    images: ['/logo.jpeg'],
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
