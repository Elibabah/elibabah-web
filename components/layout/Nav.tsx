import Link from "next/link";
import { Logo } from './Logo'
import { ThemeToggle } from "@/components/layout/ThemeToggle"   ;
export function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-background border-b border-foreground/10">
      <nav className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">

        < Logo />


        <div className="flex items-center gap-8">
          <ul className="flex items-center gap-6">
            <li>
              <Link
                href="/portfolio"
                className="font-mono text-sm text-foreground/70 hover:text-foreground transition-colors"
              >
                Portfolio
              </Link>
            </li>
            <li>
              <Link
                href="/editorial"
                className="font-mono text-sm text-foreground/70 hover:text-foreground transition-colors"
              >
                Editorial
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="font-mono text-sm text-foreground/70 hover:text-foreground transition-colors"
              >
                About
              </Link>
            </li>
          </ul>

        <ThemeToggle />
          <a
            href="#contact"
            className="font-mono text-sm text-accent border border-accent/40 rounded-full px-4 py-1.5 hover:bg-accent/5 transition-colors"
          >
            Contact
          </a>
        </div>

      </nav>
    </header>
  );
}
