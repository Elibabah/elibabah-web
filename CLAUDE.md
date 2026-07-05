# Handoff — elibabah.com (personal site, Next.js)

> Document to continue the project in Claude (VS Code).
> The working principle stays the same: **Elías writes all the code**; Claude acts as a
> thinking partner, architecture guide, and support, not as the implementer.

---

## 1. What this project is

Elías's personal professional site (handle: **Elibabah**). It is neither a pure portfolio
nor a blog: it integrates both. The primary audience is **technical recruiters and hiring
managers in New Zealand**. The site also doubles as a demonstration of the React/Next.js
skills Elías is actively developing.

Site language: **English**. Spanish is used only as a deliberate identity marker (the hero
epigraph: *"Aunque el tiempo me borre, aunque yo mismo no me recuerde, vivir habrá valido la pena."*, kept verbatim).

---

## 2. Current state (what already exists)

- Repo: **`elibabah-web`** (GitHub: `Elibabah/elibabah-web`), Next.js initialised with **pnpm**.
- Deployed on **Vercel** with custom domain **elibabah.com** (apex); `www` redirects to apex.
- **CI/CD active**: push to `main` deploys to production; branches and PRs generate Preview Deployments.
- `main` branch protected with a ruleset (restrict deletions, block force pushes).
- The project is still in Next.js's default state (the real site is not built yet).

---

## 3. Stack and technical decisions (already made, do not reopen without cause)

- **Next.js App Router** (not Pages Router).
- **MDX with front matter** for all content (projects, articles, case studies).
- Theming with **next-themes**, using \`attribute="data-theme"\`.
- Package manager: **pnpm**.
- Content lives in \`.mdx\` files, kept separate from route code.

---

## 4. Design system (already defined and validated)

**Palette — teal petrol** (WCAG AA contrast verified in light and dark):
- Accent light mode: \`#0C5566\`
- Accent dark mode: \`#4D9FB3\`

Strict colour rule: **accent appears ONLY in links, kickers, pills, and CTAs.**
Never in body text or full headings.

**Typography — three-family system:**
- **Source Serif 4** -> headings and humanist voice (never coloured).
- **Inter** -> UI and body reading.
- **JetBrains Mono** -> kickers, metadata, and code.

**Logo:** interlocked EB monogram, monochrome SVG (single-ink, scalable).
- Dark-ink variant (\`#20221a\`) for light backgrounds.
- Cream/light variant (\`#fafafa\`) for dark backgrounds.
- Embedded with theme adaptation (\`<picture>\` pattern or \`currentColor\`).

---

## 5. Site architecture (validated — do NOT reopen)

### Route map
- \`Home\` (/) — static.
- \`Portfolio\` (/portfolio) — listing. Conceptual sub-levels: selected projects,
  technical experiments, case studies.
- \`Editorial\` (/editorial) — listing with **three subsections as THEIR OWN ROUTES**:
  - \`/editorial/software\` — technical articles.
  - \`/editorial/career\` — Career & Migration: identity, craft, transition.
  - \`/editorial/aotearoa\` — Life in Aotearoa: life in NZ, travel, Southland.
- \`About\` (/about) — static, scroll sections.
- \`Contact\` — **NOT a navigable route**. Lives as a CTA in the nav and a block in the footer.
- Case studies at \`/case-studies/[slug]\` — standalone routes, linked from project cards.

### Navigation
- Nav with three items: **Portfolio, Editorial, About**.
- The logo links to Home.
- **Resume** prominent in the footer.

### Key Editorial decision
**Own routes** were chosen (not filters) for the three subsections, because each is a
distinct facet of the professional identity aimed at a distinct audience, and being able
to link \`/editorial/career\` or \`/editorial/software\` separately has value. Elías confirmed
he will feed all three regularly.

**Technical caveat:** in \`app/editorial/\`, fixed routes (\`software\`, \`career\`, \`aotearoa\`)
coexist with the dynamic \`[slug]\`. App Router prioritises the fixed ones. Reserve those
three names as forbidden article slugs, so an article does not get shadowed.

---

## 6. Target folder structure

\`\`\`
elibabah-web/
  app/
    layout.tsx              # root layout: nav, footer, theme provider
    page.tsx                # Home (/)
    portfolio/
      page.tsx              # /portfolio (listing)
      [slug]/page.tsx       # /portfolio/project
    editorial/
      page.tsx              # /editorial (general index)
      software/page.tsx     # /editorial/software
      career/page.tsx       # /editorial/career
      aotearoa/page.tsx     # /editorial/aotearoa
      [slug]/page.tsx       # /editorial/article
    case-studies/
      [slug]/page.tsx       # /case-studies/case (no index for now)
    about/
      page.tsx              # /about
  components/               # reusable UI (root, outside app/)
                            # subdivide: layout (nav, footer) vs content (cards, listings)
  content/
    portfolio/*.mdx
    editorial/*.mdx
    case-studies/*.mdx
  lib/                      # utilities: read MDX, parse front matter (content <-> app bridge)
  public/                   # static assets: logo, images
  styles/                   # design system tokens, global CSS (or app/globals)
\`\`\`

Structure decisions made:
- **\`components/\` at the root** (not inside \`app/\`), to separate routes from reusable UI.
- \`Contact\` has no folder: it is a component in the layout (CTA in nav + block in footer).
- \`case-studies\` only has \`[slug]\`, no index \`page.tsx\` (not a navigable section).
- \`[slug]\` dynamic route: one folder serves all items; growing = adding a new \`.mdx\`.

---

## 7. Content models (front matter)

### Project — \`content/portfolio/[slug].mdx\`
\`\`\`yaml
title: string
slug: string
summary: string        # 1-2 lines for the card
stack: string[]        # ['React','TypeScript','Lit']
role: string           # role in the project
year: number
links:
  demo: url?
  repo: url?
caseStudy: slug?       # link to the case study if it exists
featured: boolean      # shows on Home
cover: image?
\`\`\`

### Case Study — \`content/case-studies/[slug].mdx\`
\`\`\`yaml
title: string
slug: string
project: slug          # the project it expands on
problem: string        # the starting challenge
role: string
stack: string[]
readingTime: number
sections: MDX          # problem, decisions, alternatives, outcome
outcome: string        # impact / learning
cover: image?
\`\`\`

### Article (Editorial) — \`content/editorial/[slug].mdx\`
\`\`\`yaml
title: string
slug: string
section: enum          # 'software' | 'career' | 'aotearoa'
excerpt: string        # for the listing
publishedAt: date
readingTime: number
relatedProject: slug?  # cross-link to the portfolio
relatedCaseStudy: slug?
body: MDX
cover: image?
\`\`\`

All three models include **cross-linking** fields (\`caseStudy\`, \`relatedProject\`,
\`relatedCaseStudy\`) to weave portfolio, case studies, and editorial together.

---

## 8. Build order (suggested)

1. **Base layout + tokens** — root layout, theme provider (next-themes), design tokens
   (palette, typography), nav and footer. This is the foundation for everything.
2. **Home** — static page with hero (includes the Spanish epigraph) and highlights.
3. **Portfolio** — listing + \`[slug]\` route reading from MDX.
4. **Case Study** — \`[slug]\` route, linked from project cards.
5. **Editorial** — index + three subsections + \`[slug]\` route.
6. **About** — static with scroll sections.

Contact (CTA + footer) is integrated into the layout in step 1, not a separate step.

---

## 9. How to work with Claude on this project

- **Elías writes the code.** Claude guides architecture, reviews, explains trade-offs,
  unblocks, and proposes approaches. It does not implement by default.
- Start with step 1 (base layout + tokens) working on a branch, not directly on \`main\`
  (reminder: \`main\` is protected and the flow is branch -> PR -> preview -> merge).
- Likely first technical tasks to resolve with guidance:
  - Configure MDX in Next.js App Router (package and config).
  - Set up \`next-themes\` with \`attribute="data-theme"\`.
  - Load the three typographic families.
  - Define the design tokens (CSS variables) for light/dark.
  - Write the \`lib/\` utilities to read and parse the \`.mdx\` files in \`content/\`.

---

## 10. Minor pending items outside the site (non-blocking)

- In the GitHub profile (Edit profile, not the README): update the URL to \`elibabah.com\`
  and, if desired, show the brand email \`elias@elibabah.com\`.
- Profile README already finished and published (repo \`Elibabah/Elibabah\`, separate from this one).
- Brand email \`elias@elibabah.com\` already operational (receives via forwarding to Gmail,
  replies from the domain). Could be used as the destination for the site's Contact block later.