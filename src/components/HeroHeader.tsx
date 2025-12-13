'use client'

import { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import PixelBlast from './PixelBlast'

interface HeroHeaderProps {
  /** Badge content (icon + text) */
  badge?: ReactNode
  /** Main title */
  title: string
  /** Description text */
  description?: string
  /** Primary color for PixelBlast effect (hex) */
  primaryColor?: string
  /** Content to render in the center (buttons, forms, etc.) */
  children?: ReactNode
  /** Footer links/buttons */
  footer?: ReactNode
  /** ID of the element to scroll to */
  scrollToId?: string
  /** Whether to show PixelBlast background */
  showBackground?: boolean
  /** Custom background element (replaces PixelBlast) */
  customBackground?: ReactNode
}

export function HeroHeader({
  badge,
  title,
  description,
  primaryColor = '#888888',
  children,
  footer,
  scrollToId = 'content',
  showBackground = true,
  customBackground,
}: HeroHeaderProps) {
  return (
    <section className="min-h-[50vh] flex flex-col justify-center items-center relative border-b border-fd-border bg-fd-background overflow-hidden pb-16">
      {showBackground && (
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          {customBackground || (
            <PixelBlast
              variant="square"
              pixelSize={4}
              color={primaryColor}
              patternScale={2}
              patternDensity={1}
              pixelSizeJitter={0}
              speed={0.5}
              edgeFade={0.25}
              enableRipples
              transparent
            />
          )}
        </div>
      )}
      
      <div className="container mx-auto px-4 py-16 max-w-4xl text-center relative z-10">
        {badge && (
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-sm bg-fd-primary/10 text-fd-primary rounded-full backdrop-blur-sm border border-fd-primary/20">
            {badge}
          </div>
        )}
        
        <h1 className="text-4xl font-bold mb-4">{title}</h1>
        
        {description && (
          <p className="text-fd-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            {description}
          </p>
        )}

        {children}

        {footer && (
          <div className="flex items-center justify-center gap-4">
            {footer}
          </div>
        )}
      </div>

      {/* Scroll Indicator */}
      <button
        onClick={() => document.getElementById(scrollToId)?.scrollIntoView({ behavior: 'smooth' })}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-fd-muted-foreground hover:text-fd-foreground transition-colors cursor-pointer"
        aria-label="Scroll down"
      >
        <ChevronDown size={36} />
      </button>
    </section>
  )
}
