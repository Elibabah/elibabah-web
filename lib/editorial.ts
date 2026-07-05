import fs from "fs";
import matter from "gray-matter";
import path from "path";

export type ArticleSection = "software" | "career" | "aotearoa";

export type Article = {
  title: string;
  slug: string;
  section: ArticleSection;
  excerpt: string;
  publishedAt: string;
  readingTime: number;
  relatedProject: string | null;
  relatedCaseStudy: string | null;
  cover: string | null;
};

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
      const { data } = matter(raw);
      return data as Article;
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
  return { ...(data as Article), content };
}
