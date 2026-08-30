import { getAllResearch, getResearchBySlug, primaryEdition } from "@/lib/research";

import Image from "next/image";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { imageSlots } from "@/lib/image-slots";
import { mdxComponents, mdxOptions } from "@/lib/mdx-components";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const work = getResearchBySlug(slug);
  return {
    title: work.title,
    description: work.abstract,
    openGraph: {
      type: "article",
      title: work.title,
      description: work.abstract,
      url: `${SITE_URL}/research/${work.slug}`,
    },
    twitter: { card: "summary_large_image" },
  };
}

export async function generateStaticParams() {
  return getAllResearch().map((w) => ({ slug: w.slug }));
}

export const dynamicParams = false;

export default async function ResearchWorkPage({
  params,
}: Readonly<{
  params: Promise<{ slug: string }>;
}>) {
  const { slug } = await params;
  const work = getResearchBySlug(slug);
  const lead = primaryEdition(work);

  // The work is entirely the author's own, so a Thesis node is safe to emit here
  // in a way portfolio imagery is not (CLAUDE.md §7).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Thesis",
    name: work.title,
    alternateName: work.originalTitle,
    abstract: work.abstract,
    inSupportOf: work.degree,
    datePublished: String(work.year),
    inLanguage: work.editions.map((e) => e.lang),
    learningResourceType: work.kind,
    author: { "@id": `${SITE_URL}/#elias` },
    publisher: { "@type": "CollegeOrUniversity", name: work.institution },
    url: `${SITE_URL}/research/${work.slug}`,
    associatedMedia: work.editions.map((e) => ({
      "@type": "MediaObject",
      encodingFormat: "application/pdf",
      inLanguage: e.lang,
      contentUrl: `${SITE_URL}${e.file}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="mx-auto w-full max-w-5xl px-6 py-16 flex flex-col gap-8">

        <Link href="/research" className="font-mono text-xs text-accent hover:underline">
          ← Research
        </Link>

        <header className="flex flex-col gap-4 max-w-2xl">
          <span className="self-start bg-accent-soft text-accent font-mono text-[10px] tracking-[0.5px] uppercase px-2.5 py-1 rounded-md">
            {work.kind}
          </span>
          <h1 className="font-heading text-4xl font-bold tracking-[-0.5px] leading-[1.18] text-foreground">
            {work.title}
          </h1>
          {work.originalTitle && (
            <p className="font-body text-base text-ink-soft italic">
              {work.originalTitle}
            </p>
          )}
          <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 font-mono text-xs text-ink-soft pt-4 border-t border-line">
            <dt className="text-ink-faint">Institution</dt>
            <dd>{work.institution}</dd>
            <dt className="text-ink-faint">Degree</dt>
            <dd>{work.degree}</dd>
            <dt className="text-ink-faint">Field</dt>
            <dd>{work.field}</dd>
            <dt className="text-ink-faint">Year</dt>
            <dd>{work.year}</dd>
            {work.advisor && (
              <>
                <dt className="text-ink-faint">Advisor</dt>
                <dd>{work.advisor}</dd>
              </>
            )}
          </dl>
        </header>

        <article className="prose prose-neutral max-w-none">
          <MDXRemote source={work.content} components={mdxComponents} options={mdxOptions} />
        </article>

        {/* Editions */}
        <section className="border border-line rounded-xl bg-surface p-6 sm:p-7 flex flex-col sm:flex-row gap-6">
          {work.cover && (
            <div
              className={`${imageSlots.documentCover.aspectClass} w-32.5 shrink-0 self-center sm:self-start relative rounded-[3px] border border-line overflow-hidden bg-background`}
            >
              <Image
                src={work.cover}
                alt={work.coverAlt ?? work.title}
                fill
                sizes={imageSlots.documentCover.sizes}
                className="object-cover"
              />
            </div>
          )}

          <div className="flex flex-col gap-3 min-w-0">
            <span className="font-mono text-[10px] text-accent tracking-[0.6px] uppercase">
              Read the full text
            </span>
            <p className="font-body text-sm text-ink-soft">
              {work.editions.length > 1
                ? `Available in ${work.editions.length} languages. ${lead.label} is the original; the rest are translations of it.`
                : "Available as a PDF."}
            </p>

            <div className="flex flex-wrap gap-2.5 mt-1">
              {work.editions.map((ed) => (
                <a
                  key={ed.lang}
                  href={ed.file}
                  target="_blank"
                  rel="noopener"
                  className={`inline-flex items-baseline gap-2.5 rounded-lg border px-4 py-2.5 font-body text-sm transition-colors ${
                    ed.primary
                      ? "border-accent text-accent hover:bg-accent-soft"
                      : "border-line text-foreground hover:border-accent/40"
                  }`}
                >
                  {ed.label}
                  <span className="font-mono text-[10px] text-ink-faint">
                    PDF · {ed.pages} pp.
                  </span>
                </a>
              ))}
            </div>

            <p className="font-mono text-[10px] text-ink-faint mt-1.5">
              Opens in your browser&apos;s PDF viewer. © {work.year} Elías Hernández.
            </p>
          </div>
        </section>

      </main>
    </>
  );
}
