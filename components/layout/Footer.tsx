import { CONTACT_EMAIL, CV_PATH, GITHUB_URL, LINKEDIN_URL } from "@/lib/site";

import Link from "next/link";

export function Footer() {
  return (
    <footer
      id="contact"
      data-print="hide"
      className="bg-surface border-t border-line mt-auto transition-colors duration-350"
    >
      <div className="mx-auto max-w-5xl px-6 py-10 flex flex-col gap-10">

        {/* Contact block */}
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-2xl font-semibold text-foreground">
            Get in touch
          </h2>
          <p className="font-body text-base text-ink-soft">
            Open to new opportunities in New Zealand. Feel free to reach out.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-mono text-sm text-accent hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-5">
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-ink-soft hover:text-accent transition-colors"
            >
              LinkedIn
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-ink-soft hover:text-accent transition-colors"
            >
              GitHub
            </a>
            <Link
              href={CV_PATH}
              className="font-mono text-sm text-accent font-semibold border border-accent/30 rounded-full px-3 py-1 hover:bg-accent/10 hover:border-accent/50 transition-colors"
            >
              View CV
            </Link>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="font-mono text-xs text-ink-faint italic">
              Elibabah — Elías meets Ali Baba: the right words open the cave.
            </p>
            <p className="font-mono text-xs text-ink-faint">
              © {new Date().getFullYear()} Elías Hernández · New Zealand
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
}
