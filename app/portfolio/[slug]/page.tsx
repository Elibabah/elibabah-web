import { getAllProjects, getProjectBySlug } from "@/lib/portfolio";

import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  return {
    title: project.title,
    description: project.summary,
  };
}

export async function generateStaticParams() {
  const projects = getAllProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16 flex flex-col gap-10">

      <Link href="/portfolio" className="font-mono text-xs text-accent hover:underline">
        ← Portfolio
      </Link>

      <header className="flex flex-col gap-4 max-w-xl">
        <h1 className="font-heading text-4xl font-bold tracking-[-0.5px] text-foreground">
          {project.title}
        </h1>
        <p className="font-body text-lg text-ink-soft leading-relaxed">
          {project.summary}
        </p>
        <div className="flex items-center gap-4 flex-wrap font-mono text-xs text-ink-faint">
          <span><span className="text-ink-faint tracking-wide uppercase">Role</span>&nbsp;&nbsp;{project.role}</span>
          <span><span className="text-ink-faint tracking-wide uppercase">Year</span>&nbsp;&nbsp;{project.year}</span>
        </div>
        <ul className="flex flex-wrap gap-1.5">
          {project.stack.map((tech) => (
            <li
              key={tech}
              className="font-mono text-[10px] text-ink-soft border border-line px-2 py-0.5 rounded-[5px]"
            >
              {tech}
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3 mt-1">
          {project.links?.demo && (
            <a
              href={project.links.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-accent text-on-accent font-semibold text-sm px-5 py-[10px] rounded-[9px] hover:opacity-90 transition-opacity"
            >
              Live demo
            </a>
          )}
          {project.links?.repo && (
            <a
              href={project.links.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent border border-accent font-semibold text-sm px-5 py-[10px] rounded-[9px] hover:bg-accent/5 transition-colors"
            >
              View repo
            </a>
          )}
        </div>
        {project.caseStudy && (
          <div className="bg-surface border border-line rounded-xl p-4 flex items-center justify-between gap-4 mt-2">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-accent tracking-[0.6px] uppercase">Goes deeper</span>
              <span className="font-heading text-base text-foreground">Case study available</span>
            </div>
            <Link
              href={`/case-studies/${project.caseStudy}`}
              className="font-mono text-xs text-accent hover:underline shrink-0"
            >
              Read →
            </Link>
          </div>
        )}
      </header>

      <div className="aspect-[21/9] bg-accent-soft border border-line rounded-xl" />

      <article className="prose prose-neutral max-w-none">
        <MDXRemote source={project.content} />
      </article>

    </main>
  );
}
