import Link from "next/link";
import { Logo } from './Logo'
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-background border-b border-line transition-colors duration-[350ms]">
      <nav className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">

      <div className="flex items-center gap-[11px]">
        <Logo />
        <Link href="/" className="font-heading font-bold text-[21px] tracking-[-0.3px] text-foreground hover:text-foreground">
          elibabah
        </Link>
      </div>
      
        <div className="flex items-center gap-8">
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

      </nav>
    </header>
  );
}
