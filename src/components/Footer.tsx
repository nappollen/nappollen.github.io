import { Github, Heart, Link, Youtube } from 'lucide-react'
import sourceConfig from '@/../source.json';

export function Footer() {
  return <footer className="mt-24 border-t border-fd-border bg-fd-card/50">
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
        <div className="flex items-center gap-2 text-fd-muted-foreground text-sm">
          {sourceConfig.links.github && <a
            href={sourceConfig.links.github}
            target="_blank"
            className="text-fd-muted-foreground hover:text-fd-foreground transition-colors"
            aria-label="GitHub"
          >
            <Github size={20} />
          </a>}
          {sourceConfig.links.youtube && <a
            href={sourceConfig.links.youtube}
            target="_blank"
            className="text-fd-muted-foreground hover:text-fd-foreground transition-colors"
            aria-label="YouTube"
          >
            <Youtube size={20} />
          </a>}
        </div>
      </div>
    </div>
  </footer>;
}
