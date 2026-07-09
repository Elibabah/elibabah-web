import { getAllArticles, getArticleBySlug } from "@/lib/editorial";

import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { Metadata } from "next";

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
        <MDXRemote source={article.content} />
      </article>

    </main>
  );
}
