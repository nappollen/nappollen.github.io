'use client'

import { useState, useEffect } from 'react'
import { Package, Copy, Check, Search, Plus, ExternalLink, Info, Loader2, Globe, User, Wrench, Download, Scale, Boxes, History, Hash, Mail, Github, Users, Tag, FileBox, FileText, BookOpen, FileKey, Layers } from 'lucide-react'
import { GlobeAltIcon as GlobeAltIconSolid, UserIcon as UserIconSolid, WrenchScrewdriverIcon as WrenchScrewdriverIconSolid } from '@heroicons/react/24/solid'
import { Modal } from '@/components/Modal'
import { HeroHeader } from '@/components/HeroHeader'
import sourceConfig from '@/../source.json'

type PackageCategory = 'world' | 'avatar' | 'tool'

interface SourceConfig {
  name: string
  id: string
  url: string
  author: string,
  description: string
  infoLink?: {
    url: string
    text: string
  }
  bannerUrl?: string
  githubRepos?: string[]
}

interface PackageVersion {
  name: string
  displayName: string
  description: string
  version: string
  unity?: string
  unityRelease?: string
  license?: string
  url?: string
  changelogUrl?: string
  documentationUrl?: string
  licensesUrl?: string
  type?: string
  author?: {
    name: string
    email?: string
    url?: string
  }
  contributors?: {
    name: string
    email?: string
    url?: string
  }[]
  dependencies?: {
    [key: string]: string
  }
  vpmDependencies?: {
    [key: string]: string
  }
  samples?: {
    displayName: string
    description: string
    path: string
  }[]
  keywords?: string[]
}

interface PackageInfo {
  name: string
  displayName: string
  description: string
  version: string
  category: PackageCategory
  unity?: string
  unityRelease?: string
  license?: string
  url?: string
  changelogUrl?: string
  documentationUrl?: string
  licensesUrl?: string
  type?: string
  zipSHA256?: string
  author?: {
    name: string
    email?: string
    url?: string
  }
  contributors?: {
    name: string
    email?: string
    url?: string
  }[]
  dependencies?: {
    [key: string]: string
  }
  vpmDependencies?: {
    [key: string]: string
  }
  samples?: {
    displayName: string
    description: string
    path: string
  }[]
  keywords?: string[]
  allVersions?: { version: string; url?: string }[]
}

interface VPMIndex {
  name: string
  packages: {
    [key: string]: {
      versions: {
        [version: string]: PackageVersion
      }
    }
  }
}

const config: SourceConfig = sourceConfig.vpm as SourceConfig;

function detectCategory(vpmDependencies?: { [key: string]: string }): PackageCategory {
  if (!vpmDependencies) return 'tool'
  const deps = Object.keys(vpmDependencies)
  if (deps.some(d => d.includes('avatars'))) return 'avatar'
  if (deps.some(d => d.includes('worlds') || d.includes('udonsharp'))) return 'world'
  return 'tool'
}

const categoryConfig: Record<PackageCategory, { label: string; icon: typeof Globe; solidIcon: typeof GlobeAltIconSolid; color: string; borderColor: string; iconColor: string }> = {
  world: { label: 'World', icon: Globe, solidIcon: GlobeAltIconSolid, color: 'bg-blue-500/10 text-blue-500', borderColor: 'border-l-blue-500', iconColor: 'text-blue-500/10' },
  avatar: { label: 'Avatar', icon: User, solidIcon: UserIconSolid, color: 'bg-purple-500/10 text-purple-500', borderColor: 'border-l-purple-500', iconColor: 'text-purple-500/10' },
  tool: { label: 'Tool', icon: Wrench, solidIcon: WrenchScrewdriverIconSolid, color: 'bg-green-500/10 text-green-500', borderColor: 'border-l-green-500', iconColor: 'text-green-500/10' },
}

export default function VPMPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [copied, setCopied] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [helpTab, setHelpTab] = useState<'auto' | 'manual'>('auto')
  const [packages, setPackages] = useState<PackageInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPackage, setSelectedPackage] = useState<PackageInfo | null>(null)
  const [displayedPackage, setDisplayedPackage] = useState<PackageInfo | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<PackageCategory | 'all'>('all')
  const [primaryColor, setPrimaryColor] = useState('#888888')

  // Get primary color from CSS variable
  useEffect(() => {
    const updateColor = () => {
      const style = getComputedStyle(document.documentElement)
      const fdPrimary = style.getPropertyValue('--fd-primary').trim()
      if (fdPrimary) {
        // Convert oklch or hsl to hex if needed
        const temp = document.createElement('div')
        temp.style.color = fdPrimary
        document.body.appendChild(temp)
        const computed = getComputedStyle(temp).color
        document.body.removeChild(temp)
        
        // Parse rgb(r, g, b) to hex
        const match = computed.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
        if (match) {
          const hex = '#' + [match[1], match[2], match[3]]
            .map(x => parseInt(x).toString(16).padStart(2, '0'))
            .join('')
          setPrimaryColor(hex)
        }
      }
    }
    updateColor()
    
    // Update on theme change
    const observer = new MutationObserver(updateColor)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // Keep displayed package for animation
  useEffect(() => {
    if (selectedPackage) {
      setDisplayedPackage(selectedPackage)
    }
  }, [selectedPackage])

  useEffect(() => {
    async function loadPackages() {
      try {
        // En dev, charge depuis /vpm.json (public/), en prod depuis le basePath
        const res = await fetch('/vpm.json')
        const data: VPMIndex = await res.json()
        
        // Extraire la dernière version de chaque package
        const pkgList: PackageInfo[] = Object.entries(data.packages).map(([id, pkg]) => {
          const versions = Object.keys(pkg.versions).sort((a, b) => 
            b.localeCompare(a, undefined, { numeric: true })
          )
          const latestVersion = pkg.versions[versions[0]] as PackageVersion & { zipSHA256?: string }
          return {
            name: latestVersion.name,
            displayName: latestVersion.displayName || latestVersion.name,
            description: latestVersion.description || '',
            version: latestVersion.version,
            category: detectCategory(latestVersion.vpmDependencies),
            unity: latestVersion.unity,
            unityRelease: latestVersion.unityRelease,
            license: latestVersion.license,
            url: latestVersion.url,
            changelogUrl: latestVersion.changelogUrl,
            documentationUrl: latestVersion.documentationUrl,
            licensesUrl: latestVersion.licensesUrl,
            type: latestVersion.type,
            zipSHA256: latestVersion.zipSHA256,
            author: latestVersion.author,
            contributors: latestVersion.contributors,
            dependencies: latestVersion.dependencies,
            vpmDependencies: latestVersion.vpmDependencies,
            samples: latestVersion.samples,
            keywords: latestVersion.keywords,
            allVersions: versions.map(v => ({
              version: v,
              url: (pkg.versions[v] as PackageVersion & { url?: string }).url
            })),
          }
        })
        
        setPackages(pkgList)
      } catch (error) {
        console.error('Failed to load packages:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadPackages()
  }, [])

  const filteredPackages = packages.filter(
    (pkg) =>
      (categoryFilter === 'all' || pkg.category === categoryFilter) &&
      (pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const copyUrl = async () => {
    await navigator.clipboard.writeText(config.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const vccUrl = `vcc://vpm/addRepo?url=${encodeURIComponent(config.url)}`

  return (
    <main className="flex-1">
      <HeroHeader
        badge={
          <>
            <Package size={14} />
            VRChat Creator Companion
          </>
        }
        title={config.name}
        description={config.description}
        primaryColor={primaryColor}
        footer={
          <>
            <button
              onClick={() => setShowHelp(true)}
              className="inline-flex items-center gap-2 px-3 py-2 text-fd-muted-foreground hover:text-fd-primary transition-colors text-sm"
            >
              <Info size={16} />
              How to install?
            </button>
            {config.infoLink && (
              <a
                href={config.infoLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 text-fd-muted-foreground hover:text-fd-primary transition-colors text-sm"
              >
                <Github size={16} />
                {config.infoLink.text}
              </a>
            )}
          </>
        }
      >
        {/* URL + Add to VCC Button Group */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-stretch rounded-lg overflow-hidden border border-fd-border bg-fd-primary">
            <button
              onClick={copyUrl}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-fd-background font-mono text-sm text-fd-muted-foreground transition-colors cursor-pointer rounded-r-lg"
            >
              <code className="truncate max-w-xs sm:max-w-md">{config.url}</code>
              <span className="hover:text-fd-primary transition-colors">
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </span>
            </button>
            <a
              href={vccUrl}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-fd-primary text-fd-primary-foreground font-medium hover:bg-fd-primary/80 transition-colors"
            >
              <Plus size={18} />
              Add to VCC
            </a>
          </div>
        </div>
      </HeroHeader>

      {/* Packages Section */}
      <section id="content" className="container mx-auto px-4 py-32 max-w-4xl">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <h2 className="text-xl font-semibold">
              Available Packages
              <span className="ml-2 text-sm font-normal text-fd-muted-foreground">
                ({filteredPackages.length})
              </span>
            </h2>
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fd-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-fd-secondary border border-fd-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fd-primary"
              />
            </div>
          </div>
          
          {/* Category Filter */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-fd-primary text-fd-primary-foreground'
                  : 'bg-fd-secondary border border-fd-border hover:bg-fd-accent'
              }`}
            >
              All
            </button>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(categoryConfig) as PackageCategory[]).map((cat) => {
                const config = categoryConfig[cat]
                const Icon = config.icon
                const count = packages.filter(p => p.category === cat).length
                if (count === 0) return null
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      categoryFilter === cat
                        ? 'bg-fd-primary text-fd-primary-foreground'
                        : 'bg-fd-secondary border border-fd-border hover:bg-fd-accent'
                    }`}
                  >
                    <Icon size={14} />
                    {config.label}
                    <span className="text-xs opacity-70">({count})</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 bg-fd-card border border-fd-border rounded-xl">
            <Loader2 size={48} className="mx-auto mb-4 text-fd-muted-foreground/50 animate-spin" />
            <p className="text-fd-muted-foreground">Loading packages...</p>
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="text-center py-16 bg-fd-card border border-fd-border rounded-xl">
            <Package size={48} className="mx-auto mb-4 text-fd-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">
              {packages.length === 0 ? 'No packages yet' : 'No results'}
            </h3>
            <p className="text-fd-muted-foreground text-sm max-w-sm mx-auto">
              {packages.length === 0
                ? 'Packages will be available soon. Check back later!'
                : 'Try different search terms.'}
            </p>
          </div>
        ) : (
          <div key={categoryFilter} className="flex flex-col gap-3">
            {filteredPackages.map((pkg, index) => {
              const catConfig = categoryConfig[pkg.category]
              const CatIcon = catConfig.icon
              const CatIconSolid = catConfig.solidIcon
              return (
                <article
                  key={pkg.name}
                  className={`relative overflow-hidden p-4 bg-fd-card border border-fd-border border-l-4 ${catConfig.borderColor} rounded-xl transition-all duration-300 flex flex-col sm:flex-row sm:items-center gap-4 animate-in fade-in slide-in-from-bottom-2`}
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                >
                  {/* Background Icon */}
                  <CatIconSolid 
                    className={`absolute -right-4 top-1/2 -translate-y-1/2 w-28 h-28 ${catConfig.iconColor} pointer-events-none`}
                  />
                  <div className="flex-1 min-w-0 relative z-10">
                    <h3 className="font-semibold text-lg mb-1">
                      {pkg.displayName || pkg.name}
                    </h3>
                    <p className="text-fd-muted-foreground text-sm line-clamp-1">
                      {pkg.description || 'No description available.'}
                    </p>
                  </div>
                  <div className="flex gap-3 items-center sm:flex-shrink-0 relative z-10">
                    {pkg.documentationUrl && (
                      <a
                        href={pkg.documentationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-fd-muted-foreground hover:text-fd-primary transition-colors text-sm"
                        title="Documentation"
                      >
                        <BookOpen size={16} />
                      </a>
                    )}
                    <a
                      href={vccUrl}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-fd-primary text-fd-primary-foreground rounded-lg text-sm font-medium hover:bg-fd-primary/80 transition-colors"
                    >
                      <Plus size={16} />
                      Add to VCC
                    </a>
                    <button
                      onClick={() => setSelectedPackage(pkg)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-fd-muted-foreground hover:text-fd-primary transition-colors text-sm"
                    >
                      <Info size={16} />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedPackage}
        onClose={() => setSelectedPackage(null)}
        title={displayedPackage?.displayName || displayedPackage?.name}
      >
        {displayedPackage && (() => {
          const catConfig = categoryConfig[displayedPackage.category]
          const CatIcon = catConfig.icon
          const hasVpmDeps = displayedPackage.vpmDependencies && Object.keys(displayedPackage.vpmDependencies).length > 0
          const hasUnityDeps = displayedPackage.dependencies && Object.keys(displayedPackage.dependencies).length > 0
          return (
            <>
              {/* Description */}
              <p className="text-fd-muted-foreground mb-4">
                {displayedPackage.description || 'No description available.'}
              </p>

              {/* Tags row */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${catConfig.color}`}>
                  <CatIcon size={12} />
                  {catConfig.label}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-fd-muted text-fd-muted-foreground">
                  v{displayedPackage.version}
                </span>
                {displayedPackage.unity && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-fd-muted text-fd-muted-foreground">
                    Unity {displayedPackage.unity}{displayedPackage.unityRelease && `f${displayedPackage.unityRelease}`}
                  </span>
                )}
                {displayedPackage.license && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-fd-muted text-fd-muted-foreground">
                    <Scale size={12} />
                    {displayedPackage.license}
                  </span>
                )}
                {displayedPackage.type && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-fd-muted text-fd-muted-foreground">
                    <Layers size={12} />
                    {displayedPackage.type}
                  </span>
                )}
              </div>

              {/* Keywords */}
              {displayedPackage.keywords && displayedPackage.keywords.length > 0 && (
                <div className="mb-4">
                  <span className="text-fd-muted-foreground text-xs flex items-center gap-1.5 mb-1">
                    <Tag size={12} />
                    Keywords
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {displayedPackage.keywords.map((kw, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-fd-secondary text-fd-muted-foreground border border-fd-border">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div>
                  <span className="text-fd-muted-foreground text-xs flex items-center gap-1.5 mb-1"><Package size={12} /> Package ID</span>
                  <p className="font-mono text-xs bg-fd-muted px-2 py-1 rounded truncate">{displayedPackage.name}</p>
                </div>
                {displayedPackage.author?.name && (
                  <div>
                    <span className="text-fd-muted-foreground text-xs flex items-center gap-1.5 mb-1"><User size={12} /> Author</span>
                    <p className="truncate">
                      {displayedPackage.author.url ? (
                        <a
                          href={displayedPackage.author.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-fd-primary hover:underline inline-flex items-center gap-1 text-sm"
                        >
                          {displayedPackage.author.name}
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-sm">{displayedPackage.author.name}</span>
                      )}
                    </p>
                  </div>
                )}
                {displayedPackage.author?.email && (
                  <div>
                    <span className="text-fd-muted-foreground text-xs flex items-center gap-1.5 mb-1"><Mail size={12} /> Contact</span>
                    <p className="truncate">
                      <a
                        href={`mailto:${displayedPackage.author.email}`}
                        className="hover:text-fd-primary hover:underline text-sm"
                      >
                        {displayedPackage.author.email}
                      </a>
                    </p>
                  </div>
                )}
                {displayedPackage.contributors && displayedPackage.contributors.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-fd-muted-foreground text-xs flex items-center gap-1.5 mb-1"><Users size={12} /> Contributors</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {displayedPackage.contributors.map((c, i) => (
                        c.url ? (
                          <a
                            key={i}
                            href={c.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm hover:text-fd-primary hover:underline"
                          >
                            {c.name}
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span key={i} className="text-sm">{c.name}</span>
                        )
                      ))}
                    </div>
                  </div>
                )}
                {displayedPackage.allVersions && displayedPackage.allVersions.length > 1 && (
                  <div className="col-span-2">
                    <span className="text-fd-muted-foreground text-xs flex items-center gap-1.5 mb-1"><History size={12} /> All versions</span>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {displayedPackage.allVersions.map((v, i) => (
                        v.url ? (
                          <a
                            key={v.version}
                            href={v.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`hover:text-fd-primary hover:underline inline-flex items-center gap-1 text-sm font-mono ${i === 0 ? 'text-fd-primary font-medium' : ''}`}
                          >
                            {v.version}{i === 0 && ' (latest)'}
                            <Download size={12} />
                          </a>
                        ) : (
                          <span key={v.version} className={`text-sm font-mono ${i === 0 ? 'text-fd-primary font-medium' : 'text-fd-muted-foreground'}`}>
                            {v.version}{i === 0 && ' (latest)'}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SHA256 */}
              {displayedPackage.zipSHA256 && (
                <div className="mb-4">
                  <span className="text-fd-muted-foreground text-xs flex items-center gap-1.5 mb-1">
                    <Hash size={12} />
                    SHA256
                  </span>
                  <p className="font-mono text-xs bg-fd-muted px-2 py-1 rounded break-all text-fd-muted-foreground select-all">
                    {displayedPackage.zipSHA256}
                  </p>
                </div>
              )}

              {/* Dependencies */}
              {(hasVpmDeps || hasUnityDeps) && (
                <div className="mb-4">
                  <span className="text-fd-muted-foreground text-xs flex items-center gap-1.5 mb-1">
                    <Boxes size={12} />
                    Dependencies
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {hasVpmDeps && Object.entries(displayedPackage.vpmDependencies!).map(([dep, ver]) => (
                      <span key={dep} className="px-2 py-0.5 rounded text-xs bg-blue-500/10 text-blue-500 font-mono">
                        {dep} {ver}
                      </span>
                    ))}
                    {hasUnityDeps && Object.entries(displayedPackage.dependencies!).map(([dep, ver]) => (
                      <span key={dep} className="px-2 py-0.5 rounded text-xs bg-fd-muted text-fd-muted-foreground font-mono">
                        {dep} {ver}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Samples */}
              {displayedPackage.samples && displayedPackage.samples.length > 0 && (
                <div className="mb-4">
                  <span className="text-fd-muted-foreground text-xs flex items-center gap-1.5 mb-1">
                    <FileBox size={12} />
                    Samples included
                  </span>
                  <div className="space-y-1">
                    {displayedPackage.samples.map((sample, i) => (
                      <div key={i} className="text-sm px-2 py-1 bg-fd-muted rounded flex items-center gap-1.5 overflow-hidden">
                        <span className="font-medium shrink-0">{sample.displayName}</span>
                        {sample.description && (
                          <>
                            <span className="text-fd-muted-foreground shrink-0">•</span>
                            <span className="text-fd-muted-foreground truncate">{sample.description}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-6 pt-4 border-t border-fd-border">
                <a
                  href={vccUrl}
                  onClick={() => setSelectedPackage(null)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-fd-primary text-fd-primary-foreground rounded-lg font-medium hover:bg-fd-primary/80 transition-colors"
                >
                  <Plus size={18} />
                  Add to VCC
                </a>
                {displayedPackage.url && (
                  <a
                    href={displayedPackage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-fd-secondary border border-fd-border rounded-lg font-medium hover:bg-fd-accent transition-colors"
                    title="Download ZIP"
                  >
                    <Download size={18} />
                  </a>
                )}
                {displayedPackage.documentationUrl && (
                  <a
                    href={displayedPackage.documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-fd-secondary border border-fd-border rounded-lg font-medium hover:bg-fd-accent transition-colors"
                    title="Documentation"
                  >
                    <BookOpen size={18} />
                  </a>
                )}
                {displayedPackage.licensesUrl && (
                  <a
                    href={displayedPackage.licensesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-fd-secondary border border-fd-border rounded-lg font-medium hover:bg-fd-accent transition-colors"
                    title="License"
                  >
                    <FileKey size={18} />
                  </a>
                )}
                {displayedPackage.author?.url && (
                  <a
                    href={displayedPackage.author.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-fd-secondary border border-fd-border rounded-lg font-medium hover:bg-fd-accent transition-colors"
                    title="View on GitHub"
                  >
                    <Github size={18} />
                  </a>
                )}
                {displayedPackage.changelogUrl && (
                  <a
                    href={displayedPackage.changelogUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-fd-secondary border border-fd-border rounded-lg font-medium hover:bg-fd-accent transition-colors"
                    title="View Changelog"
                  >
                    <FileText size={18} />
                  </a>
                )}
              </div>
            </>
          )
        })()}
      </Modal>

      {/* Help Modal */}
      <Modal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="How to install?"
      >
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-fd-muted rounded-lg mb-4">
          <button
            onClick={() => setHelpTab('auto')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              helpTab === 'auto'
                ? 'bg-fd-background text-fd-foreground shadow-sm'
                : 'text-fd-muted-foreground hover:text-fd-foreground'
            }`}
          >
            Automatic
          </button>
          <button
            onClick={() => setHelpTab('manual')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              helpTab === 'manual'
                ? 'bg-fd-background text-fd-foreground shadow-sm'
                : 'text-fd-muted-foreground hover:text-fd-foreground'
            }`}
          >
            Manual
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[120px]">
          {helpTab === 'auto' ? (
            <div className="space-y-4">
              {/* Intro text */}
              <p className="text-sm text-fd-muted-foreground">
                Browse the package list below and click <span className="font-medium text-fd-foreground">&quot;Add to VCC&quot;</span> on any package:
              </p>

              {/* Visual illustration - same style as package cards */}
              <div className="relative overflow-hidden p-4 bg-fd-card border border-fd-border border-l-4 border-l-green-500 rounded-xl">
                {/* Background Icon */}
                <WrenchScrewdriverIconSolid className="absolute -right-4 top-1/2 -translate-y-1/2 w-28 h-28 text-green-500/10 pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1">Example Package</h3>
                    <p className="text-fd-muted-foreground text-sm line-clamp-1">A useful tool for your project</p>
                  </div>
                  <div className="relative flex-shrink-0">
                    <div className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-fd-primary text-fd-primary-foreground rounded-lg text-sm font-medium animate-pulse">
                      <Plus size={16} />
                      Add to VCC
                    </div>
                    {/* Cursor */}
                    <svg className="absolute -bottom-2 -right-2 w-6 h-6 drop-shadow-md" viewBox="0 0 24 24">
                      <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.85a.5.5 0 0 0-.85.36Z" fill="black" stroke="white" strokeWidth="1.5"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* What happens */}
              <p className="text-sm text-fd-muted-foreground">
                This will open <span className="font-medium text-fd-foreground">VRChat Creator Companion</span> and automatically add this repository. The packages will then be available in your project&apos;s package manager.
              </p>

              <div className="pt-2 border-t border-fd-border">
                <p className="text-sm text-fd-muted-foreground mb-3">
                  Or add the entire repository at once:
                </p>

                {/* Action button */}
                <a
                  href={vccUrl}
                  onClick={() => setShowHelp(false)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-fd-secondary border border-fd-border rounded-lg font-medium hover:bg-fd-accent transition-colors"
                >
                  <Plus size={18} />
                  Add Repository to VCC
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <ol className="text-sm text-fd-muted-foreground space-y-2">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-fd-primary text-fd-primary-foreground flex items-center justify-center text-xs font-medium">1</span>
                  <span className="pt-0.5">Open VRChat Creator Companion</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-fd-primary text-fd-primary-foreground flex items-center justify-center text-xs font-medium">2</span>
                  <span className="pt-0.5">Go to <span className="font-medium text-fd-foreground">Settings → Packages</span></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-fd-primary text-fd-primary-foreground flex items-center justify-center text-xs font-medium">3</span>
                  <span className="pt-0.5">Click <span className="font-medium text-fd-foreground">Add Repository</span></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-fd-primary text-fd-primary-foreground flex items-center justify-center text-xs font-medium">4</span>
                  <span className="pt-0.5 flex-1">
                    Paste the repository URL:
                    <span className="flex items-center gap-2 mt-1">
                      <code className="flex-1 px-2 py-1 bg-fd-muted rounded text-xs font-mono text-fd-foreground truncate">
                        {config.url}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(config.url)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        }}
                        className="flex-shrink-0 p-1.5 hover:bg-fd-accent rounded transition-colors"
                        title="Copy URL"
                      >
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </span>
                  </span>
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Footer link */}
        <div className="mt-4 pt-4 border-t border-fd-border">
          <a
            href="https://vcc.docs.vrchat.com/guides/community-repositories/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-fd-primary hover:underline"
          >
            VCC Documentation <ExternalLink size={14} />
          </a>
        </div>
      </Modal>
    </main>
  )
}
