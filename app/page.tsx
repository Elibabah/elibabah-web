import Link from "next/link";
import { getAllArticles } from "@/lib/editorial";
import { getAllProjects } from "@/lib/portfolio";

export default function Home() {
  const latestArticles = getAllArticles().slice(0, 3);
  const featuredProjects = getAllProjects().filter(p => p.featured);


  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16 flex flex-col gap-20">

      {/* Hero */}
      <section className="flex flex-col gap-5">
        <div className="flex items-center gap-2.5">
          <span className="w-[7px] h-[7px] rounded-full bg-accent shrink-0" />
          <span className="font-mono text-xs text-ink-soft tracking-[0.6px] uppercase">
            Frontend Engineer · Auckland, NZ
          </span>
        </div>
        <h1 className="font-heading max-w-xxl font-bold text-5xl leading-[1.12] tracking-[-0.5px] text-foreground">
          Building software with intention.<br />
          Sharing the thinking behind it.<br />
        </h1>
        <p className="font-body text-lg leading-relaxed text-ink-soft max-w-xl">
          I build software, think about the craft in the age of AI, and write about the move from Mexico to New Zealand. A portfolio and an editorial, under one roof.
        </p>
        <div className="flex items-center gap-3 mt-1">
          <Link
            href="/portfolio"
            className="bg-accent text-on-accent font-semibold text-sm px-5 py-[11px] rounded-[9px] hover:opacity-90 transition-opacity"
          >
            View work
          </Link>
          <Link
            href="/about"
            className="text-accent border border-accent font-semibold text-sm px-5 py-[11px] rounded-[9px] hover:bg-accent/5 transition-colors"
          >
            About me
          </Link>
        </div>
      </section>

      {/* Selected Work */}
      <section className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-accent tracking-[0.6px] uppercase">
            Featured Work
          </span>
          <Link href="/portfolio" className="font-mono text-xs text-accent font-semibold hover:underline">
            All projects →
          </Link>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredProjects.map((project) => (
            <li key={project.slug} className="flex flex-col">
              <Link
                href={`/portfolio/${project.slug}`}
                className="h-full group flex flex-col bg-surface border border-line rounded-2xl overflow-hidden transition-[transform,box-shadow,border-color] duration-[220ms] hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(0,0,0,0.06)] hover:border-accent"
              >
                <div className="aspect-[16/10] bg-accent-soft border-b border-line" />
                <div className="flex flex-col gap-2 p-4">
                  <h3 className="font-heading font-bold text-lg text-foreground">
                    {project.title}
                  </h3>
                  <p className="font-body text-sm text-ink-soft leading-snug">
                    {project.summary}
                  </p>
                  <ul className="flex flex-wrap gap-1.5 mt-1">
                    {project.stack.map((tech) => (
                      <li
                        key={tech}
                        className="font-mono text-[10px] text-ink-soft border border-line px-2 py-0.5 rounded-[5px]"
                      >
                        {tech}
                      </li>
                    ))}
                  </ul>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Latest from Editorial */}
      {latestArticles.length > 0 && (
        <section className="flex flex-col gap-0">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-xs text-accent tracking-[0.6px] uppercase">
              Latest from the Editorial
            </span>
            <Link href="/editorial" className="font-mono text-xs text-accent font-semibold hover:underline">
              All writing →
            </Link>
          </div>
          <ul>
            {latestArticles.map((article) => (
              <li key={article.slug}>
                <Link
                  href={`/editorial/${article.slug}`}
                  className="group flex items-center justify-between gap-6 py-[18px] border-t border-line"
                >
                  <div className="flex flex-col gap-2 min-w-0">
                    <span className="self-start bg-accent-soft text-accent font-mono text-[10px] tracking-[0.5px] uppercase px-[10px] py-1 rounded-md">
                      {article.section}
                    </span>
                    <span className="font-heading text-lg leading-[1.32] text-foreground group-hover:text-accent transition-colors duration-200">
                      {article.title}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-ink-faint whitespace-nowrap shrink-0">
                    {article.readingTime} min · {article.publishedAt}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

    </main>
  );
}
