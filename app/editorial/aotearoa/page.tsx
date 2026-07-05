import Link from "next/link";
import { getArticlesBySection } from "@/lib/editorial";

export default function AotearoaPage() {
  const articles = getArticlesBySection("aotearoa");

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 flex flex-col gap-12">
      <h1 className="font-heading text-4xl font-bold text-foreground">
        Aotearoa
      </h1>
      <ul className="flex flex-col gap-8">
        {articles.map((article) => (
          <li key={article.slug} className="flex flex-col gap-2">
            <Link
              href={`/editorial/${article.slug}`}
              className="font-heading text-xl font-semibold text-foreground hover:text-accent transition-colors"
            >
              {article.title}
            </Link>
            <p className="font-body text-sm text-foreground/70">{article.excerpt}</p>
            <p className="font-mono text-xs text-foreground/50">
              {article.publishedAt} · {article.readingTime} min read
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
