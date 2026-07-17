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
        I am David Elías Hernández Morales, a frontend engineer based in New Zealand. 
        I build interfaces for large-scale products, with a focus on component architecture, 
        accessibility, and code that stays maintainable long after it ships.
        I care about the part of engineering that does not show: the decisions underneath a component, 
        the reasons a system holds together or quietly falls apart. 
        </p>
        <p className="font-body text-base text-ink-soft leading-relaxed">
          Good software, like good writing, is a question of precision, rhythm, and care.
        </p>
      </section>

      {/* Background */}
      <section className="flex flex-col gap-3 py-8 border-t border-line max-w-xl">
        <h2 className="font-heading text-2xl font-bold text-foreground">Background</h2>
        <p className="font-body text-base text-ink-soft leading-relaxed">
        I came to software through language. I trained as a linguist and literary scholar, 
        and spent years learning to read structure: how a system of signs holds meaning, 
        where an argument breaks, why one arrangement works and another does not.
        That turned out to be engineering training in disguise. I read code the way I once read texts, 
        attentive to intention and structure, and I approach architecture as a problem of meaning as much as mechanics.
        Over five years I have built enterprise interfaces at Sngular, React products at Innovattia for Walmart, 
        and now design-system components at BBVA, where I work with Web Components and Lit across banking products used by millions. 
        I am also completing a Master of Applied Management at SIT, which has sharpened how I connect technical work to strategy, value, and the business it serves.
        </p>
      </section>

      {/* Stack */}
      <section className="flex flex-col gap-4 py-8 border-t border-line max-w-xl">
        <h2 className="font-heading text-2xl font-bold text-foreground">What I work with</h2>
        <p className="font-body text-base text-ink-soft leading-relaxed">
          My core is JavaScript, TypeScript, Web Components, and Lit; 
          the last two are what I work with daily at BBVA, 
          building reusable components for a shared design system. React is where 
          I have shipped production work and where I am actively deepening, alongside Next.js. 
          This site is part of that practice: built from scratch, App Router, MDX, continuous deployment.
        </p>
        <ul className="flex flex-wrap gap-2 mt-1">
          {["TypeScript", "JavaScript", "Web Components", "Lit", "React.js", "Next.js", "Node.js", "Accessibility", "Design Systems"].map((tech) => (
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
        I wanted to build my career somewhere international and English-speaking, 
        and New Zealand made a particular kind of sense: a small country that punches 
        well above its size in technology, where Auckland holds its own as a genuine tech hub. 
        Being here means being where things happen, without needing to be somewhere enormous to feel it.
        The decision was also a family one. We looked at several countries and chose this one because of 
        what it offers for raising children: safety, calm, and a set of values we recognised. 
        The closeness to the natural world was not a small part of it either.
        And something here rhymes with where I come from. Coming from Mexico, 
        with its own deep pre-Hispanic cultures, I find something familiar in 
        the way this country carries its Māori history and worldview. 
        I am still learning, and I know how little I know, but the resonance is real. 
        I have always felt like a citizen of the world. This is where that feels true.
        </p>
      </section>

    </main>
  );
}
