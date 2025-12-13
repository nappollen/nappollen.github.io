import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { Package, Home } from 'lucide-react';
import Image from 'next/image';
import sourceConfig from '@/../source.json';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <div className="flex items-center gap-2.5">
          <Image
            src="/favicon-96x96.png"
            alt="Logo"
            width={28}
            height={28}
            className="rounded-sm"
          />
          <span className="font-bold text-lg">{sourceConfig.title}</span>
        </div>
      ),
    },
    links: [
      {
        icon: <Home />,
        text: 'Home',
        url: '/',
      },
      {
        icon: <Package />,
        text: 'VPM',
        url: '/vpm',
        active: 'nested-url',
      },
    ],
    // GitHub icon button (displayed separately on the right)
    githubUrl: sourceConfig.links.github || undefined,
  };
}
