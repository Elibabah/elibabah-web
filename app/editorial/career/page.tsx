import Link from "next/link";
import type { Metadata } from "next";
import { getArticlesBySection } from "@/lib/editorial";

export const metadata: Metadata = {
  title: "Career",
  description: "On craft, identity, and professional transition.",
};

export default function CareerPage() {
  const articles = getArticlesBySection("career");

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16 flex flex-col gap-10">

      <header className="flex flex-col gap-2">
        <Link href="/editorial" className="font-mono text-xs text-accent hover:underline">
          ← Editorial
        </Link>
        <h1 className="font-heading text-4xl font-bold tracking-[-0.5px] text-foreground mt-2">
          Career
        </h1>
        <p className="font-body text-base text-ink-soft mt-1">
          On craft, identity, and the experience of professional transition.
        </p>
      </header>

      <ul>
        {articles.map((article) => (
          <li key={article.slug}>
            <Link
              href={`/editorial/${article.slug}`}
              className="group flex items-center justify-between gap-6 py-[18px] border-t border-line"
            >
              <div className="flex flex-col gap-2 min-w-0">
                <span className="font-heading text-lg leading-[1.32] text-foreground group-hover:text-accent transition-colors duration-200">
                  {article.title}
                </span>
                <span className="font-body text-sm text-ink-soft line-clamp-2">
                  {article.excerpt}
                </span>
              </div>
              <span className="font-mono text-xs text-ink-faint whitespace-nowrap shrink-0 text-right">
                {article.readingTime} min<br />{article.publishedAt}
              </span>
            </Link>
          </li>
        ))}
      </ul>

    </main>
  );
}
