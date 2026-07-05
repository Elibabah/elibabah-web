import fs from "fs";
import matter from "gray-matter";
import path from "path";

export type CaseStudy = {
  title: string;
  slug: string;
  project: string;
  problem: string;
  role: string;
  stack: string[];
  readingTime: number;
  outcome: string;
  cover: string | null;
};

export type CaseStudyWithContent = CaseStudy & {
  content: string;
};

const CASE_STUDIES_DIR = path.join(process.cwd(), "content/case-studies");

export function getAllCaseStudies(): CaseStudy[] {
  const files = fs.readdirSync(CASE_STUDIES_DIR);
  return files
    .filter((f) => f.endsWith(".mdx"))
    .map((filename) => {
      const raw = fs.readFileSync(
        path.join(CASE_STUDIES_DIR, filename),
        "utf-8"
      );
      const { data } = matter(raw);
      return data as CaseStudy;
    });
}

export function getCaseStudyBySlug(slug: string): CaseStudyWithContent {
  const filepath = path.join(CASE_STUDIES_DIR, `${slug}.mdx`);
  const raw = fs.readFileSync(filepath, "utf-8");
  const { data, content } = matter(raw);
  return { ...(data as CaseStudy), content };
}
