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
    <main className="mx-auto w-full max-w-3xl px-6 py-16 flex flex-col gap-12">
      <h1 className="font-heading text-4xl font-bold text-foreground">
        Portfolio
      </h1>

      <ul className="flex flex-col gap-8">
        {projects.map((project) => (
          <li key={project.slug} className="flex flex-col gap-3">
            <Link
              href={`/portfolio/${project.slug}`}
              className="font-heading text-xl font-semibold text-foreground hover:text-accent transition-colors"
            >
              {project.title}
            </Link>
            <p className="font-body text-sm text-foreground/70">
              {project.summary}
            </p>
            <p className="font-mono text-xs text-foreground/50">
              {project.role} · {project.year}
            </p>
            <ul className="flex flex-wrap gap-2">
              {project.stack.map((tech) => (
                <li
                  key={tech}
                  className="font-mono text-xs text-accent border border-accent/30 rounded-full px-3 py-1"
                >
                  {tech}
                </li>
              ))}
            </ul>

            {project.caseStudy && (
              <Link
                href={`/case-studies/${project.caseStudy}`}
                className="font-mono text-xs text-accent hover:underline"
                >
                Case Study →
              </Link>
              )}
          </li>
        ))}
      </ul>
    </main>
  );
}
