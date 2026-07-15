"use client"

import Link from "next/link";
import { Logo } from './Logo'
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useState } from "react"

export function Nav() {

  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <header className="sticky top-0 z-50 bg-background border-b border-line transition-colors duration-350">
      <nav className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">

        {/* 1. Brand — always visible */}
        <div className="flex items-center gap-2.75">
          <Logo />
          <Link href="/" className="font-heading font-bold text-[21px] tracking-[-0.3px] text-foreground hover:text-foreground">
            elibabah
          </Link>
        </div>
      
        {/* 2. Desktop — hidden in mobile */}
        <div className="hidden md:flex items-center gap-8">
          <ul className="flex items-center gap-6">
            <li>
              <Link
                href="/portfolio"
                className="font-mono text-sm text-ink-soft hover:text-foreground transition-colors"
              >
                Portfolio
              </Link>
            </li>
            <li>
              <Link
                href="/editorial"
                className="font-mono text-sm text-ink-soft hover:text-foreground transition-colors"
              >
                Editorial
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="font-mono text-sm text-ink-soft hover:text-foreground transition-colors"
              >
                About
              </Link>
            </li>
          </ul>

          <ThemeToggle />

          <a
            href="#contact"
            className="font-mono text-sm bg-accent text-on-accent font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Contact
          </a>
        </div>

        {/* 3. Mobile — hidden in desktop */}
        <div className="flex md:hidden items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-foreground p-1"
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <line x1="3" y1="6" x2="17" y2="6" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="14" x2="17" y2="14" />
              </svg>
            )}
          </button>
        </div>
        
      </nav>

       {/* Panel móvil */}
      {isOpen && (
        <div className="md:hidden border-t border-line px-6 py-6 flex flex-col gap-5">
          <Link className="font-mono text-sm text-ink-soft hover:text-foreground transition-colors py-1"
              href="/portfolio" onClick={() => setIsOpen(false)}>Portfolio</Link>
          <Link className="font-mono text-sm text-ink-soft hover:text-foreground transition-colors py-1"
              href="/editorial" onClick={() => setIsOpen(false)}>Editorial</Link>
          <Link className="font-mono text-sm text-ink-soft hover:text-foreground transition-colors py-1"
              href="/about" onClick={() => setIsOpen(false)}>About</Link>
          <a href="#contact" onClick={() => setIsOpen(false)}
             className="font-mono text-sm bg-accent text-on-accent font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity w-full text-center">
            Contact
          </a>
        </div>
      )}
    </header>
  );
}
