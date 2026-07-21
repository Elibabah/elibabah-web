import { getAllCaseStudies, getCaseStudyBySlug } from "@/lib/case-studies";

import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { Metadata } from "next";
import { getProjectBySlug } from "@/lib/portfolio";
import { mdxComponents } from "@/lib/mdx-components";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = getCaseStudyBySlug(slug);
  return {
    title: caseStudy.title,
    description: caseStudy.problem,
  };
}

export async function generateStaticParams() {
  const caseStudies = getAllCaseStudies();
  return caseStudies.map((cs) => ({ slug: cs.slug }));
}

export const dynamicParams = false;

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const caseStudy = getCaseStudyBySlug(slug);
  const project = getProjectBySlug(caseStudy.project);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16 flex flex-col gap-10">

      <Link href={`/portfolio/${project.slug}`} className="font-mono text-xs text-accent hover:underline">
        ← Back to {project.title}
      </Link>

      <header className="flex flex-col gap-4 max-w-xl">
        <span className="self-start bg-accent-soft text-accent font-mono text-[10px] tracking-[0.5px] uppercase px-2.5 py-1 rounded-md">
          Case Study
        </span>
        <h1 className="font-heading text-4xl font-bold tracking-[-0.5px] text-foreground">
          {caseStudy.title}
        </h1>
        <p className="font-body text-lg text-ink-soft leading-relaxed italic">
          {caseStudy.problem}
        </p>
        <div className="flex items-center gap-4 flex-wrap font-mono text-xs text-ink-faint">
          <span><span className="tracking-wide uppercase">Role</span>&nbsp;&nbsp;{caseStudy.role}</span>
          <span><span className="tracking-wide uppercase">Read</span>&nbsp;&nbsp;{caseStudy.readingTime} min</span>
        </div>
        <ul className="flex flex-wrap gap-1.5">
          {caseStudy.stack.map((tech) => (
            <li
              key={tech}
              className="font-mono text-[10px] text-ink-soft border border-line px-2 py-0.5 rounded-[5px]"
            >
              {tech}
            </li>
          ))}
        </ul>
      </header>

      <div className="aspect-21/9 bg-accent-soft border border-line rounded-xl" />

      <article className="prose prose-neutral max-w-none">
        <MDXRemote source={caseStudy.content} components={mdxComponents}/>
      </article>

      <footer className="border-t border-line pt-8 flex flex-col gap-2">
        <span className="font-mono text-[10px] text-ink-faint tracking-[0.6px] uppercase">Outcome</span>
        <p className="font-body text-base text-ink-soft leading-relaxed">
          {caseStudy.outcome}
        </p>
      </footer>

    </main>
  );
}
