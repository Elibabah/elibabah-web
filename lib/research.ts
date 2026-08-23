import fs from "node:fs";
import matter from "gray-matter";
import path from "node:path";

/**
 * A language edition of a research document. A work may ship in one language
 * (the Applied Management thesis will) or several (the UNAM thesis ships in two).
 * `primary` marks the language the work was written in; the rest are translations.
 */
export type ResearchEdition = {
  lang: string;      // ISO code: "es", "en"
  label: string;     // as shown to the reader: "Español", "English"
  file: string;      // path under /public
  pages: number;
  primary?: boolean;
};

type ResearchFrontmatter = {
  title: string;           // display title, English
  originalTitle?: string;  // title in the original language, when it differs
  slug: string;
  kind: string;            // "Undergraduate thesis", "Master's thesis"…
  field: string;           // "Hispanic Language and Literature", "Applied Management"…
  institution: string;
  degree: string;
  year: number;
  advisor?: string;
  abstract: string;        // listing card + page intro
  featured: boolean;
  cover?: string;          // documentCover slot; see lib/image-slots.ts
  coverAlt?: string;
  editions: ResearchEdition[];
};

export type Research = ResearchFrontmatter;

export type ResearchWithContent = Research & {
  content: string;
};

const RESEARCH_DIR = path.join(process.cwd(), "content/research");

export function getAllResearch(): Research[] {
  if (!fs.existsSync(RESEARCH_DIR)) return [];
  return fs
    .readdirSync(RESEARCH_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((filename) => {
      const raw = fs.readFileSync(path.join(RESEARCH_DIR, filename), "utf-8");
      const { data } = matter(raw);
      return data as ResearchFrontmatter;
    })
    .sort((a, b) => b.year - a.year);
}

export function getResearchBySlug(slug: string): ResearchWithContent {
  const filepath = path.join(RESEARCH_DIR, `${slug}.mdx`);
  const raw = fs.readFileSync(filepath, "utf-8");
  const { data, content } = matter(raw);
  return { ...(data as ResearchFrontmatter), content };
}

/** The edition to lead with: the original language, or the first declared. */
export function primaryEdition(work: Research): ResearchEdition {
  return work.editions.find((e) => e.primary) ?? work.editions[0];
}
