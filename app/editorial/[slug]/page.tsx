import { getAllArticles, getArticleBySlug } from "@/lib/editorial";

import Image from "next/image"
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { Metadata } from "next";
import { findProjectBySlug } from '@/lib/portfolio'
import { mdxComponents } from "@/lib/mdx-components";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  return {
    title: article.title,
    description: article.excerpt,
  };
}

export async function generateStaticParams() {
  const articles = getAllArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export const dynamicParams = false;

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  const relatedProject = article.relatedProject
  ? findProjectBySlug(article.relatedProject)
  : null;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16 flex flex-col gap-8">

      <Link href={`/editorial/${article.section}`} className="font-mono text-xs text-accent hover:underline">
        ← {article.section.charAt(0).toUpperCase() + article.section.slice(1)}
      </Link>

      <header className="flex flex-col gap-4 max-w-xl">
        <span className="self-start bg-accent-soft text-accent font-mono text-[10px] tracking-[0.5px] uppercase px-2.5 py-1 rounded-md">
          {article.section}
        </span>
        <h1 className="font-heading text-4xl font-bold tracking-[-0.5px] leading-[1.18] text-foreground">
          {article.title}
        </h1>
        <div className="flex items-center gap-3 font-mono text-sm text-ink-soft pb-6 border-b border-line">
          <span>{article.publishedAt}</span>
          <span className="text-ink-faint">·</span>
          <span>{article.readingTime} min read</span>
        </div>
      </header>

      <article className="prose prose-neutral max-w-none">
        <MDXRemote source={article.content} components={mdxComponents} />
      </article>

      {relatedProject && (
        <div className="max-w-xl border border-line rounded-xl bg-surface p-5 flex items-center gap-4">
          {relatedProject.cover ? (
            <Image
              src={relatedProject.cover}
              alt=""
              width={80}
              height={80}
              className="rounded-[9px] object-cover shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-[9px] bg-accent-soft border border-line shrink-0" />
          )}
          <div className="flex flex-col gap-1 min-w-0">
            <span className="font-mono text-[10px] text-accent tracking-[0.5px] uppercase">
              Related project
            </span>
            <span className="font-heading text-base text-foreground">
              {relatedProject.title}
            </span>
            <p className="font-body text-sm text-ink-soft line-clamp-2">
              {relatedProject.summary}
            </p>
            <Link
              href={`/portfolio/${relatedProject.slug}`}
              className="font-mono text-xs text-accent hover:underline mt-0.5"
            >
              View project →
            </Link>
          </div>
        </div>
      )}

    </main>
  );
}
