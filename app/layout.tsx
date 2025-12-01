import type { Metadata } from "next";
import ThemeRegistry from './ThemeRegistry';
import './globals.css';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';

export const metadata: Metadata = {
  title: "プロ野球観戦記録アプリ",
  description: "プロ野球観戦記録アプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&family=Tektur:wght@400;500;600;700&display=swap"
        />
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            background-image: url('/assets/ph.jpg');
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            margin: 0; /* Remove default body margin */
            padding: 0; /* Remove default body padding */
          }
        `}} />
      </head>
      <body suppressHydrationWarning>
        <AppRouterCacheProvider>
          <ThemeRegistry>{children}</ThemeRegistry>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
