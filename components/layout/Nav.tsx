"use client"

import { Menu, X } from "lucide";
import { useEffect, useRef, useState } from "react"

import Link from "next/link";
import { Logo } from './Logo'
import { MorphIcon } from "morphicons/react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const NAV_LINKS = [
  { href: "/portfolio", label: "Portfolio" },
  { href: "/editorial", label: "Editorial" },
  { href: "/about", label: "About" },
] as const;

export function Nav() {

  const [isOpen, setIsOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    const handleScroll = () => setIsOpen(false);
    
    function handlePointerDown(event: PointerEvent) {
      const header = headerRef.current;
      if (header && !header.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, { passive: true, once: true });

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isOpen]);
  
  return (
    <header ref={headerRef} className="sticky top-0 z-50 bg-background border-b border-line transition-colors duration-350">
      <nav className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">

        {/* 1. Brand — always visible */}
        <Logo includesName={true} />
        {/* 2. Desktop — hidden in mobile */}
        <div className="hidden md:flex items-center gap-8">
          <ul className="flex items-center gap-6">
            {NAV_LINKS.map(section => 
              <li 
                key={section.label}>
                  <Link href={section.href} 
                    className="font-mono text-sm text-ink-soft hover:text-foreground transition-colors">
                    {section.label}
                  </Link>
              </li>
            )}
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
            ref={buttonRef}
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-foreground p-1"
            aria-label="Menu"
            aria-expanded={isOpen}
          > 
            <MorphIcon icon={isOpen ? X : Menu} size={20} strokeWidth={1.75} spring="smooth" />
          </button> 
        </div>
        
      </nav>

       {/* Panel móvil */}
      {isOpen && (
        <div className="md:hidden absolute top-full inset-x-0 bg-background border-b border-line px-6 py-6 flex flex-col gap-5">
          {NAV_LINKS.map(section => 
            <Link 
              key={section.label} 
              href={section.href} 
              onClick={() => setIsOpen(false)} 
              className="font-mono text-sm text-ink-soft hover:text-foreground transition-colors py-1">
                {section.label}
            </Link>
          )}
          <a href="#contact" onClick={() => setIsOpen(false)}
             className="font-mono text-sm bg-accent text-on-accent font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity w-full text-center">
            Contact
          </a>
        </div>
      )}

    </header>
  );
}
