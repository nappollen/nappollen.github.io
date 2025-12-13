import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { Footer } from '@/components/Footer';
import type { Metadata } from 'next';
import sourceConfig from '@/../source.json';

export const metadata: Metadata = {
  title: 'VPM',
  description: sourceConfig.description,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <HomeLayout {...baseOptions()}>
      {children}
      <Footer />
    </HomeLayout>
  );
}
