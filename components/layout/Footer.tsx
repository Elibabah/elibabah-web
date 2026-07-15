export function Footer() {
  return (
    <footer id="contact" className="bg-surface border-t border-line mt-auto transition-colors duration-350">
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
            href="mailto:elias@elibabah.com"
            className="font-mono text-sm text-accent hover:underline"
          >
            elias@elibabah.com
          </a>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-5">
            <a
              href="https://linkedin.com/in/elibabah"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-ink-soft hover:text-accent transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="https://github.com/elibabah"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-ink-soft hover:text-accent transition-colors"
            >
              GitHub
            </a>
            <a
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-accent font-semibold hover:underline"
            >
              Resume ↓
            </a>
          </div>
          <p className="font-mono text-xs text-ink-faint">
            © {new Date().getFullYear()} Elías Hernández · New Zealand
          </p>
        </div>

      </div>
    </footer>
  );
}
