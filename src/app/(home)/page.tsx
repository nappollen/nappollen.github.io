'use client'

import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Package, BookOpen, Github, Wrench, Gamepad2, Code2, Sparkles, Youtube, ArrowRight } from 'lucide-react';
import { HeroHeader } from '@/components/HeroHeader';
import sourceConfig from '@/../source.json';
import FaultyTerminal from '@/components/FaultyTerminal';
import { useEffect, useState } from 'react';

export default function HomePage() {
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

  return (
    <>
      <HeroHeader
        badge={
          <>
            <Gamepad2 size={14} />
            Unity Developer
          </>
        }
        title={sourceConfig.title || 'Default'}
        description={sourceConfig.description || 'Welcome to my portfolio!'}
        customBackground={<FaultyTerminal
          scale={1.2}
          gridMul={[4, 1]}
          digitSize={1.2}
          timeScale={0.2}
          scanlineIntensity={0.5}
          glitchAmount={0.8}
          flickerAmount={0.5}
          noiseAmp={0.9}
          chromaticAberration={2}
          curvature={0.1}
          tint={primaryColor}
          mouseStrength={0.3}
          brightness={0.4}
          pageLoadAnimation={false}
        />}
      >
        <div className="flex flex-wrap gap-3 justify-center">
          {sourceConfig.links.github && <a
            href={sourceConfig.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-lg shadow-purple-600/25"
          >
            <Github size={18} /> GitHub
          </a>}
          {sourceConfig.links.youtube && <a
            href={sourceConfig.links.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-600/25"
          >
            <Youtube size={18} /> YouTube
          </a>}
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-fd-secondary/80 backdrop-blur-sm border border-fd-border rounded-lg font-medium hover:bg-fd-accent transition-colors"
          >
            <BookOpen size={18} /> Documentation
          </Link>
        </div>
      </HeroHeader>

      {/* Unity Tooling Section - Text Left, Image Right */}
      <section id="content" className="px-4 py-20 border-b border-fd-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-sm bg-fd-primary/10 text-fd-primary rounded-full">
                <Code2 size={14} />
                Unity Tooling
              </div>
              <h2 className="text-3xl font-bold mb-4">Custom Editor Tools</h2>
              <p className="text-fd-muted-foreground mb-6">
                I develop powerful Unity editor extensions that streamline workflows and boost productivity.
                From automation scripts to custom inspectors, my tools help developers focus on what matters most.
              </p>
              <ul className="space-y-2 text-fd-muted-foreground mb-6">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-fd-primary rounded-full"></span>
                  Custom editor windows & inspectors
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-fd-primary rounded-full"></span>
                  Build automation pipelines
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-fd-primary rounded-full"></span>
                  Workflow optimization tools
                </li>
              </ul>
              <a
                href={sourceConfig.links.github + '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-fd-primary hover:underline font-medium"
              >
                View on GitHub <ArrowRight size={16} />
              </a>
            </div>
            <div className="relative aspect-video bg-fd-card border border-fd-border rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-fd-primary/20 to-fd-primary/5 flex items-center justify-center">
                <Code2 size={64} className="text-fd-primary/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VPM Packages Section - Image Left, Text Right */}
      <section className="px-4 py-20 border-b border-fd-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-video bg-fd-card border border-fd-border rounded-xl overflow-hidden md:order-1">
              <div className="absolute inset-0 bg-gradient-to-br from-fd-primary/20 to-fd-primary/5 flex items-center justify-center">
                <Package size={64} className="text-fd-primary/30" />
              </div>
            </div>
            <div className="md:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-sm bg-fd-primary/10 text-fd-primary rounded-full">
                <Package size={14} />
                Package Development
              </div>
              <h2 className="text-3xl font-bold mb-4">VPM Repository</h2>
              <p className="text-fd-muted-foreground mb-6">
                A curated collection of packages for VRChat Creator Companion.
                Easy to install, well documented, and regularly updated to support the latest SDK versions.
              </p>
              <ul className="space-y-2 text-fd-muted-foreground mb-6">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-fd-primary rounded-full"></span>
                  One-click VCC installation
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-fd-primary rounded-full"></span>
                  Avatar & World utilities
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-fd-primary rounded-full"></span>
                  Regular updates & support
                </li>
              </ul>
              <Link
                href="/vpm"
                className="inline-flex items-center gap-2 text-fd-primary hover:underline font-medium"
              >
                Browse packages <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* VRChat Creations Section - Text Left, Image Right */}
      <section className="px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-sm bg-fd-primary/10 text-fd-primary rounded-full">
                <Sparkles size={14} />
                VRChat Creations
              </div>
              <h2 className="text-3xl font-bold mb-4">Avatars & Worlds</h2>
              <p className="text-fd-muted-foreground mb-6">
                Creating immersive experiences for VRChat. From custom avatars with advanced features
                to interactive worlds, I bring creative visions to life in social VR.
              </p>
              <ul className="space-y-2 text-fd-muted-foreground mb-6">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-fd-primary rounded-full"></span>
                  Custom avatar systems
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-fd-primary rounded-full"></span>
                  Interactive world mechanics
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-fd-primary rounded-full"></span>
                  Shader & VFX development
                </li>
              </ul>
              <a
                href={sourceConfig.links.youtube || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-fd-primary hover:underline font-medium"
              >
                Watch on YouTube <ArrowRight size={16} />
              </a>
            </div>
            <div className="relative aspect-video bg-fd-card border border-fd-border rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-fd-primary/20 to-fd-primary/5 flex items-center justify-center">
                <Sparkles size={64} className="text-fd-primary/30" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
