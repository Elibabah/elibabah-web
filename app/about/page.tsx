import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Software developer based in New Zealand.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16 flex flex-col gap-2">

      <div className="flex flex-col gap-2 pb-10">
        <div className="flex items-center gap-2.5">
          <span className="w-1.75 h-1.75 rounded-full bg-accent shrink-0" />
          <span className="font-mono text-xs text-ink-soft tracking-[0.6px] uppercase">About</span>
        </div>
        <h1 className="font-heading text-4xl font-bold tracking-[-0.5px] text-foreground">
          Elías Hernández
        </h1>
      </div>

      {/* Intro */}
      <section className="flex flex-col gap-3 py-8 border-t border-line max-w-xl">
        <h2 className="font-heading text-2xl font-bold text-foreground">Who I am</h2>
        <p className="font-body text-base text-ink-soft leading-relaxed">
          I am David Elías Hernández Morales, a software developer based in New Zealand.
          I build web applications with a focus on clean architecture and
          thoughtful user experience.
        </p>
        <p className="font-body text-base text-ink-soft leading-relaxed">
          Placeholder — one or two sentences about what drives you professionally.
        </p>
      </section>

      {/* Background */}
      <section className="flex flex-col gap-3 py-8 border-t border-line max-w-xl">
        <h2 className="font-heading text-2xl font-bold text-foreground">Background</h2>
        <p className="font-body text-base text-ink-soft leading-relaxed">
          Placeholder — your trajectory before arriving in NZ. Previous industry,
          how you transitioned into software, what you worked on before.
        </p>
      </section>

      {/* Stack */}
      <section className="flex flex-col gap-4 py-8 border-t border-line max-w-xl">
        <h2 className="font-heading text-2xl font-bold text-foreground">What I work with</h2>
        <p className="font-body text-base text-ink-soft leading-relaxed">
          Placeholder — the technologies you use regularly and the ones you are
          actively developing.
        </p>
        <ul className="flex flex-wrap gap-2 mt-1">
          {["React", "TypeScript", "Next.js", "Node.js", "PostgreSQL"].map((tech) => (
            <li
              key={tech}
              className="font-mono text-xs text-accent border border-accent/30 rounded-full px-3 py-1"
            >
              {tech}
            </li>
          ))}
        </ul>
      </section>

      {/* NZ */}
      <section className="flex flex-col gap-3 py-8 border-t border-line max-w-xl">
        <h2 className="font-heading text-2xl font-bold text-foreground">Life in Aotearoa</h2>
        <p className="font-body text-base text-ink-soft leading-relaxed">
          Placeholder — why New Zealand, what you are looking for here,
          what the experience of building a career in a new country means to you.
        </p>
      </section>

    </main>
  );
}
