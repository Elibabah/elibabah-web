import fs from "node:fs";
import matter from "gray-matter";
import path from "node:path";
import { readingTimeOf } from "./reading-time"

export type ArticleSection = "software" | "career" | "aotearoa";

type ArticleFrontmatter = {
  title: string;
  slug: string;
  section: ArticleSection;
  excerpt: string;
  publishedAt: string;
  relatedProject: string | null;
  heroBand: string | null; // hero -> /portfolio/[slug], /case-studies/[slug], /editorial/[slug]
  heroAlt?: string;
  heroCredit?: string;
  heroCaption?: string;
};

export type Article = ArticleFrontmatter & { readingTime: number };

export type ArticleWithContent = Article & {
  content: string;
};

const EDITORIAL_DIR = path.join(process.cwd(), "content/editorial");

export function getAllArticles(): Article[] {
  const files = fs.readdirSync(EDITORIAL_DIR);
  return files
    .filter((f) => f.endsWith(".mdx"))
    .map((filename) => {
      const raw = fs.readFileSync(path.join(EDITORIAL_DIR, filename), "utf-8");
      const { data, content } = matter(raw);
      return { ...(data as ArticleFrontmatter), readingTime: readingTimeOf(content) };
    })
    .sort((a, b) => (a.publishedAt > b.publishedAt ? -1 : 1));
}

export function getArticlesBySection(section: ArticleSection): Article[] {
  return getAllArticles().filter((a) => a.section === section);
}

export function getArticleBySlug(slug: string): ArticleWithContent {
  const filepath = path.join(EDITORIAL_DIR, `${slug}.mdx`);
  const raw = fs.readFileSync(filepath, "utf-8");
  const { data, content } = matter(raw);
  return { ...(data as ArticleFrontmatter), content, readingTime: readingTimeOf(content) };
}
