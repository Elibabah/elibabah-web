import Link from "next/link";
import type { Metadata } from "next";
import { getAllProjects } from "@/lib/portfolio";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Selected projects and technical experiments.",
};

export default function PortfolioPage() {
  const projects = getAllProjects();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16 flex flex-col gap-12">

      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <span className="w-[7px] h-[7px] rounded-full bg-accent shrink-0" />
          <span className="font-mono text-xs text-ink-soft tracking-[0.6px] uppercase">Work</span>
        </div>
        <h1 className="font-heading text-4xl font-bold tracking-[-0.5px] text-foreground">
          Portfolio
        </h1>
        <p className="font-body text-base text-ink-soft mt-1">
          Selected projects, technical experiments, and a few pieces told in depth.
        </p>
      </header>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {projects.map((project) => (
          <li key={project.slug}>
            <Link
              href={`/portfolio/${project.slug}`}
              className="group flex flex-col bg-surface border border-line rounded-2xl overflow-hidden transition-[transform,box-shadow,border-color] duration-[220ms] hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(0,0,0,0.06)] hover:border-accent h-full"
            >
              <div className="aspect-[16/10] bg-accent-soft border-b border-line" />
              <div className="flex flex-col gap-2 p-5 flex-1">
                <h2 className="font-heading font-bold text-xl text-foreground">
                  {project.title}
                </h2>
                <p className="font-body text-sm text-ink-soft leading-relaxed">
                  {project.summary}
                </p>
                <p className="font-mono text-xs text-ink-faint mt-1">
                  {project.role} · {project.year}
                </p>
                <ul className="flex flex-wrap gap-1.5 mt-2">
                  {project.stack.map((tech) => (
                    <li
                      key={tech}
                      className="font-mono text-[10px] text-ink-soft border border-line px-2 py-0.5 rounded-[5px]"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>
                {project.caseStudy && (
                  <span className="font-mono text-xs text-accent mt-2 group-hover:underline">
                    Read case study →
                  </span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>

    </main>
  );
}
