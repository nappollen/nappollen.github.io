import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { Footer } from '@/components/Footer';
import type { Metadata } from 'next';
import sourceConfig from '@/../source.json';

const vpm = sourceConfig.vpm as { name: string; description: string; url: string };
const siteUrl = new URL(vpm.url).origin;

export const metadata: Metadata = {
  title: vpm.name,
  description: vpm.description,
  openGraph: {
    title: vpm.name,
    description: vpm.description,
    type: 'website',
    url: `${siteUrl}/vpm`,
  },
  twitter: {
    card: 'summary',
    title: vpm.name,
    description: vpm.description,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <HomeLayout {...baseOptions()}>
      {children}
      <Footer />
    </HomeLayout>
  );
}
