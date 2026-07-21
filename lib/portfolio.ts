import fs from "fs";
import matter from "gray-matter";
import path from "path";

export type Project = {
  title: string;
  slug: string;
  summary: string;
  stack: string[];
  role: string;
  year: number;
  featured: boolean;
  links: {
    demo: string | null;
    repo: string | null;
  };
  caseStudy: string | null;
  cover: string | null;
};

export type ProjectWithContent = Project & {
  content: string;
};

const PORTFOLIO_DIR = path.join(process.cwd(), "content/portfolio");

export function getAllProjects(): Project[] {
  const files = fs.readdirSync(PORTFOLIO_DIR);

  return files
    .filter((f) => f.endsWith(".mdx"))
    .map((filename) => {
      const raw = fs.readFileSync(path.join(PORTFOLIO_DIR, filename), "utf-8");
      const { data } = matter(raw);
      return data as Project;
    })
    .sort((a, b) => b.year - a.year);
}

export function getProjectBySlug(slug: string): ProjectWithContent {
  const filepath = path.join(PORTFOLIO_DIR, `${slug}.mdx`);
  const raw = fs.readFileSync(filepath, "utf-8");
  const { data, content } = matter(raw);

  return {
    ...(data as Project),
    content,
  };
}

export function findProjectBySlug(slug: string): Project | null {
  const filepath = path.join(PORTFOLIO_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filepath)) return null;
  const raw = fs.readFileSync(filepath, "utf-8");
  const { data } = matter(raw);
  return data as Project;
}
