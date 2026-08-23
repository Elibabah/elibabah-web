import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllResearch } from "@/lib/research";
import { imageSlots } from "@/lib/image-slots";

export const metadata: Metadata = {
  title: "Research",
  description: "Academic work: theses and long-form research, with their language editions.",
};

export default function ResearchPage() {
  const works = getAllResearch();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16 flex flex-col gap-10">

      <header className="flex flex-col gap-2 max-w-xl">
        <div className="flex items-center gap-2.5">
          <span className="w-1.75 h-1.75 rounded-full bg-accent shrink-0" />
          <span className="font-mono text-xs text-ink-soft tracking-[0.6px] uppercase">Academic</span>
        </div>
        <h1 className="font-heading text-4xl font-bold tracking-[-0.5px] text-foreground">
          Research
        </h1>
        <p className="font-body text-base text-ink-soft mt-1">
          Long-form academic work, in full. Each piece is offered in every language it exists in.
        </p>
      </header>

      {works.length === 0 ? (
        <p className="font-body text-base text-ink-faint border-t border-line pt-6">
          Nothing published here yet.
        </p>
      ) : (
        <ul className="flex flex-col">
          {works.map((work) => (
            <li key={work.slug}>
              <Link
                href={`/research/${work.slug}`}
                className="group flex gap-6 py-7 border-t border-line"
              >
                {work.cover && (
                  <div
                    className={`${imageSlots.documentCover.aspectClass} w-27.5 shrink-0 relative rounded-[3px] border border-line overflow-hidden bg-surface`}
                  >
                    <Image
                      src={work.cover}
                      alt={work.coverAlt ?? work.title}
                      fill
                      sizes="110px"
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-2 min-w-0">
                  <span className="self-start bg-accent-soft text-accent font-mono text-[10px] tracking-[0.5px] uppercase px-2.5 py-1 rounded-md">
                    {work.kind}
                  </span>
                  <span className="font-heading text-lg leading-[1.32] text-foreground group-hover:text-accent transition-colors duration-200">
                    {work.title}
                  </span>
                  <span className="font-mono text-xs text-ink-faint">
                    {work.institution} · {work.year}
                  </span>
                  <p className="font-body text-sm text-ink-soft line-clamp-3 mt-0.5">
                    {work.abstract}
                  </p>
                  <div className="flex gap-2 mt-1.5">
                    {work.editions.map((ed) => (
                      <span
                        key={ed.lang}
                        className="font-mono text-[10px] text-ink-soft border border-line rounded-full px-2.5 py-0.5"
                      >
                        {ed.label}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

    </main>
  );
}
