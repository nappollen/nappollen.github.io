import { readFileSync } from 'fs'
import { join } from 'path'
import type { Metadata } from 'next'
import PackageRedirect from './PackageRedirect'
import sourceConfig from '@/../source.json'

interface PackageVersion {
  displayName?: string
  description?: string
  bannerUrl?: string
  version?: string
}

interface VPMData {
  packages: {
    [key: string]: {
      description?: string
      listingUrl?: string
      versions: { [v: string]: PackageVersion }
    }
  }
}

function readVPMData(): VPMData {
  try {
    const raw = readFileSync(join(process.cwd(), 'public', 'vpm.json'), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return { packages: {} }
  }
}

const vpm = sourceConfig.vpm as { name: string; description: string; url: string }
const siteUrl = new URL(vpm.url).origin

export function generateStaticParams() {
  const data = readVPMData()
  return Object.keys(data.packages).map((id) => ({ packageId: id }))
}

export async function generateMetadata(
  props: { params: Promise<{ packageId: string }> }
): Promise<Metadata> {
  const { packageId } = await props.params
  const data = readVPMData()
  const pkg = data.packages[packageId]

  if (!pkg) {
    return {
      title: 'Package not found',
      description: vpm.description,
    }
  }

  const release = Object.values(pkg.versions ?? {})[0] ?? {}
  const title = release.displayName || packageId
  const description = release.description || pkg.description || vpm.description
  const image = release.bannerUrl

  return {
    title,
    description,
    openGraph: {
      title: `${title} • ${vpm.name}`,
      description,
      type: 'website',
      url: `${siteUrl}/vpm/${packageId}`,
      ...(image && { images: [{ url: image, alt: title }] }),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: `${title} • ${vpm.name}`,
      description,
      ...(image && { images: [image] }),
    },
  }
}

export default async function PackagePage(props: { params: Promise<{ packageId: string }> }) {
  const { packageId } = await props.params
  return <PackageRedirect packageId={packageId} />
}
