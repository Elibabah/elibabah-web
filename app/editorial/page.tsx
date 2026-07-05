import Link from "next/link";
import { getAllArticles } from "@/lib/editorial";

export default function EditorialPage() {
  const articles = getAllArticles();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 flex flex-col gap-12">
      <h1 className="font-heading text-4xl font-bold text-foreground">
        Editorial
      </h1>
      <ul className="flex flex-col gap-8">
        {articles.map((article) => (
          <li key={article.slug} className="flex flex-col gap-2">
            <span className="font-mono text-xs text-accent uppercase tracking-wide">
              {article.section}
            </span>
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
