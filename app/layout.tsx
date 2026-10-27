import type { Metadata, Viewport } from 'next';
import { Instrument_Sans } from 'next/font/google';
import { Shell } from '@/components/Shell';
import './globals.css';

const sans = Instrument_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: { default: 'Trust layer · fresh-quality claims', template: '%s · Trust layer' },
  description:
    'A prototype quality layer for a grocery app: farm-to-door freshness cards, instant replacements checked by an AI photo review, and batch-level accountability.',
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={sans.variable}>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
