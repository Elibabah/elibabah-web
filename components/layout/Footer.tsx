export function Footer() {
  return (
    <footer id="contact" className="border-t border-foreground/10 mt-auto">
      <div className="mx-auto max-w-3xl px-6 py-16 flex flex-col gap-12">

        {/* Contact block */}
        <div className="flex flex-col gap-4">
          <h2 className="font-heading text-2xl font-semibold text-foreground">
            Get in touch
          </h2>
          <p className="font-body text-base text-foreground/70">
            Open to new opportunities in New Zealand. Feel free to reach out.
          </p>
          <a
            href="mailto:elias@elibabah.com"
            className="font-mono text-sm text-accent hover:underline"
          >
            elias@elibabah.com
          </a>
        </div>

        {/* Resume + copyright */}
        <div className="flex items-center justify-between">
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm text-accent border border-accent/40 rounded-full px-4 py-1.5 hover:bg-accent/5 transition-colors"
          >
            Download Resume
          </a>
          <p className="font-mono text-xs text-foreground/40">
            © {new Date().getFullYear()} Elías Hernández
          </p>
        </div>

      </div>
    </footer>
  );
}
