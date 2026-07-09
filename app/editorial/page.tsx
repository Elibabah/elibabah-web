import Link from "next/link";
import type { Metadata } from "next";
import { getAllArticles } from "@/lib/editorial";

export const metadata: Metadata = {
  title: "Editorial",
  description: "Writing on software, career, and life in Aotearoa.",
};

export default function EditorialPage() {
  const articles = getAllArticles();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16 flex flex-col gap-10">

      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <span className="w-[7px] h-[7px] rounded-full bg-accent shrink-0" />
          <span className="font-mono text-xs text-ink-soft tracking-[0.6px] uppercase">Writing</span>
        </div>
        <h1 className="font-heading text-4xl font-bold tracking-[-0.5px] text-foreground">
          Editorial
        </h1>
        <p className="font-body text-base text-ink-soft mt-1">
          Software, career, and life in Aotearoa. Three sections, one voice.
        </p>
        <div className="flex gap-3 mt-2">
          {(["software", "career", "aotearoa"] as const).map((s) => (
            <Link
              key={s}
              href={`/editorial/${s}`}
              className="font-mono text-[10px] text-accent border border-accent/30 px-3 py-1 rounded-md hover:bg-accent-soft transition-colors capitalize"
            >
              {s}
            </Link>
          ))}
        </div>
      </header>

      <ul>
        {articles.map((article) => (
          <li key={article.slug}>
            <Link
              href={`/editorial/${article.slug}`}
              className="group flex items-center justify-between gap-6 py-[18px] border-t border-line"
            >
              <div className="flex flex-col gap-2 min-w-0">
                <span className="self-start bg-accent-soft text-accent font-mono text-[10px] tracking-[0.5px] uppercase px-2.5 py-1 rounded-md">
                  {article.section}
                </span>
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
