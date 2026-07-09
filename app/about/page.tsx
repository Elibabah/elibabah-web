import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Software developer based in New Zealand.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 flex flex-col gap-24">

      {/* Intro */}
      <section className="flex flex-col gap-6">
        <h1 className="font-heading text-4xl font-bold text-foreground">
          About
        </h1>
        <p className="font-body text-lg text-foreground/80 leading-relaxed">
          I'm Elías Hernández, a software developer based in New Zealand.
          I build web applications with a focus on clean architecture and
          thoughtful user experience.
        </p>
        <p className="font-body text-lg text-foreground/80 leading-relaxed">
          Placeholder — one or two sentences about what drives you professionally.
        </p>
      </section>

      {/* Background */}
      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-2xl font-semibold text-foreground">
          Background
        </h2>
        <p className="font-body text-base text-foreground/70 leading-relaxed">
          Placeholder — your trajectory before arriving in NZ. Previous industry,
          how you transitioned into software, what you worked on before.
        </p>
      </section>

      {/* Stack */}
      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-2xl font-semibold text-foreground">
          What I work with
        </h2>
        <p className="font-body text-base text-foreground/70 leading-relaxed">
          Placeholder — the technologies you use regularly and the ones you're
          actively developing.
        </p>
        <ul className="flex flex-wrap gap-2 mt-2">
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
      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-2xl font-semibold text-foreground">
          Life in Aotearoa
        </h2>
        <p className="font-body text-base text-foreground/70 leading-relaxed">
          Placeholder — why New Zealand, what you're looking for here,
          what the experience of building a career in a new country means to you.
        </p>
      </section>

    </main>
  );
}
