import { getAllProjects, getProjectBySlug } from "@/lib/portfolio";

import { MDXRemote } from "next-mdx-remote/rsc";

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
    <main className="mx-auto w-full max-w-3xl px-6 py-16 flex flex-col gap-12">
      <header className="flex flex-col gap-4">
        <h1 className="font-heading text-4xl font-bold text-foreground">
          {project.title}
        </h1>
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
      </header>

      <article className="prose prose-neutral max-w-none">
        <MDXRemote source={project.content} />
      </article>
    </main>
  );
}
