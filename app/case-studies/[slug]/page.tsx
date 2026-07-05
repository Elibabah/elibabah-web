import { getAllCaseStudies, getCaseStudyBySlug } from "@/lib/case-studies";

import { MDXRemote } from "next-mdx-remote/rsc";

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

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 flex flex-col gap-12">
      <header className="flex flex-col gap-4">
        <h1 className="font-heading text-4xl font-bold text-foreground">
          {caseStudy.title}
        </h1>
        <p className="font-body text-base text-foreground/70 italic">
          {caseStudy.problem}
        </p>
        <p className="font-mono text-xs text-foreground/50">
          {caseStudy.role} · {caseStudy.readingTime} min read
        </p>
        <ul className="flex flex-wrap gap-2">
          {caseStudy.stack.map((tech) => (
            <li
              key={tech}
              className="font-mono text-xs text-accent border border-accent/30 rounded-full px-3 py-1"
            >
              {tech}
            </li>
          ))}
        </ul>
      </header>

      <article className="prose prose-neutral max-w-none">
        <MDXRemote source={caseStudy.content} />
      </article>

      <footer className="border-t border-foreground/10 pt-8">
        <p className="font-mono text-xs text-foreground/50 uppercase tracking-wide">
          Outcome
        </p>
        <p className="font-body text-base text-foreground/80 mt-2">
          {caseStudy.outcome}
        </p>
      </footer>
    </main>
  );
}
