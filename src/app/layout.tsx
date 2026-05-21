import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import sourceConfig from '@/../source.json';

const inter = Inter({
  subsets: ['latin'],
});

const siteUrl = new URL((sourceConfig.vpm as { url: string }).url).origin;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: sourceConfig.title || '',
    template: `%s • ${sourceConfig.title || ''}`,
  },
  description: sourceConfig.description || '',
  openGraph: {
    siteName: sourceConfig.title,
    type: 'website',
    url: siteUrl,
    title: sourceConfig.title,
    description: sourceConfig.description,
  },
  twitter: {
    card: 'summary',
    title: sourceConfig.title,
    description: sourceConfig.description,
  },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
