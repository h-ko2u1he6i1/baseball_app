import type { Metadata } from 'next';
import { Noto_Sans_JP, Tektur } from 'next/font/google';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import ThemeRegistry from './ThemeRegistry';
import './globals.css';

const notoSansJp = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
  variable: '--font-noto-sans-jp',
});

const tektur = Tektur({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-tektur',
});

export const metadata: Metadata = {
  title: {
    default: 'プロ野球観戦記録アプリ',
    template: '%s | プロ野球観戦記録アプリ',
  },
  description: 'プロ野球の観戦記録を投稿・一覧できるアプリ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${notoSansJp.variable} ${tektur.variable}`}>
      <body suppressHydrationWarning>
        <AppRouterCacheProvider>
          <ThemeRegistry>{children}</ThemeRegistry>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
