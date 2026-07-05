import Link from "next/link";

const highlights = [
{
  title: "Project Alpha",
  summary: "A short description of what this project does and why it matters.",
  stack: ["React", "TypeScript", "Next.js"],
  role: "Frontend Developer",
  year: 2026,
  slug: "project-alpha",
},
{
  title: "Project Beta",
  summary: "Another short description that fits in two lines at most.",
  stack: ["Node.js", "PostgreSQL"],
  role: "Full Stack Developer",
  year: 2026,
  slug: "project-beta",
},
{
  title: "Project Gamma",
  summary: "Something interesting built with interesting tools.",
  stack: ["Python", "FastAPI"],
  role: "Backend Developer",
  year: 2026,
  slug: "project-gamma",
},
];

export default function Home() {

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 flex flex-col gap-24">
      {/* Hero */}
      <section className="flex flex-col gap-6">
        <h1 className="font-heading text-5xl font-bold text-foreground">
          Elías Hernández
        </h1>
        <p className="font-body text-lg text-foreground/70">
          Software developer based in New Zealand.
        </p>
        <blockquote className="border-l-2 border-accent pl-5">
          <p className="font-heading italic text-foreground/50 text-base leading-relaxed">
            Aunque el tiempo me borre, aunque yo mismo no me recuerde, vivir habrá valido la pena.
          </p>
        </blockquote>
        <div>
          <Link
            href="/portfolio"
            className="font-mono text-sm text-accent hover:underline"
          >
            View my work →
          </Link>
        </div>
      </section>

      {/* Highlights */}
      <section className="flex flex-col gap-8">
        <h2 className="font-heading text-2xl font-semibold text-foreground">
          Selected work
        </h2>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {highlights.map((project) => (
            <li key={project.slug} className="flex flex-col gap-3">
              <h3 className="font-heading text-lg font-semibold text-foreground">
                {project.title}
              </h3>
              <p className="font-body text-sm text-foreground/70">
                {project.summary}
              </p>
              <p className="font-mono text-xs text-foreground/50">
                {project.role} · {project.year}
              </p>
              <ul className="flex flex-wrap gap-2">
                {project.stack.map((tech) => (
                  <li
                    key={tech}
                    className="font-mono text-xs text-accent border border-accent/30 rounded-full px-3 py-1"
                  >
                    {tech}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>



    </main>
  );
}
