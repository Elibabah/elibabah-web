import { getAllArticles, getArticleBySlug } from "@/lib/editorial";

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
    <main className="mx-auto w-full max-w-3xl px-6 py-16 flex flex-col gap-12">
      <header className="flex flex-col gap-4">
        <span className="font-mono text-xs text-accent uppercase tracking-wide">
          {article.section}
        </span>
        <h1 className="font-heading text-4xl font-bold text-foreground">
          {article.title}
        </h1>
        <p className="font-mono text-xs text-foreground/50">
          {article.publishedAt} · {article.readingTime} min read
        </p>
      </header>

      <article className="prose prose-neutral max-w-none">
        <MDXRemote source={article.content} />
      </article>
    </main>
  );
}
