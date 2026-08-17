# Handoff — elibabah.com (personal site, Next.js)

> Document to continue the project in Claude (VS Code).
> The working principle stays the same: **Elías writes all the code**; Claude acts as a thinking partner, architecture guide, and support, not as the implementer.
>
> Public-facing overview of the same project lives in [README.md](README.md). This file holds
> the *decisions and rationale*; the README holds the *facts a visitor needs*. Keep them in sync.

---

## 1. What this project is

Elías's personal professional site (handle: **Elibabah**). It is neither a pure portfolio nor a blog: it integrates both. The primary audience is **technical recruiters and hiring managers in New Zealand**. The site also doubles as a demonstration of the React/Next.js skills Elías is actively developing.

Site language: **English**. Spanish is reserved as a deliberate identity marker — the epigraph
*"Aunque el tiempo me borre, aunque yo mismo no me recuerde, vivir habrá valido la pena."*,
kept verbatim. **Not placed on the site yet**: the current Home hero uses an English headline
("Building software with intention. Sharing the thinking behind it."). Still pending a decision
on where the epigraph lands — Home hero, About, or footer.

---

## 2. Current state (as of August 2026)

Infrastructure:

- Repo: **`elibabah-web`** (GitHub: `Elibabah/elibabah-web`), **pnpm**.
- Deployed on **Vercel** with custom domain **elibabah.com** (apex); `www` redirects to apex.
- **CI/CD active**: push to `main` deploys to production; branches and PRs generate Preview Deployments.
- `main` branch protected with a ruleset (restrict deletions, block force pushes).

The site is built and live. All routes from the architecture in §5 exist:

- Home with hero, Featured Work and Latest from the Editorial.
- `/portfolio` listing + `/portfolio/[slug]`.
- `/editorial` index + `/editorial/software`, `/career`, `/aotearoa` + `/editorial/[slug]`.
- `/case-studies/[slug]`.
- `/about`.

Also in place:

- Root layout with the three fonts via `next/font/google`, `ThemeProvider`, Nav (with mobile menu),
  Footer, and Person JSON-LD (with a stable `@id`, referenced from page-level blocks).
- Design tokens as CSS variables in `app/globals.css`, exposed to Tailwind v4 via `@theme inline`.
- Theme toggle (`next-themes`, `data-theme`), light/dark palettes.
- Contact as an anchor: nav CTA `#contact` → `<footer id="contact">` with `mailto:elias@elibabah.com`,
  LinkedIn, GitHub and `resume.pdf`.
- SEO/ops: `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`, `icon.svg`, `not-found.tsx`,
  Google site verification, Vercel Analytics and Speed Insights.
- MDX pipeline: `gray-matter` for front matter, `next-mdx-remote` for the body,
  `lib/mdx-components.tsx` for the component mapping.
- Image system: `lib/image-slots.ts` as the single source of aspect ratios, responsive widths,
  `sizes` and recommended export dimensions. Intrinsic dimensions are read at build time with
  `image-size`, so MDX images never declare width/height by hand.
- Reading time derived from the body in `lib/reading-time.ts`, not declared per file.
- Image credit and authorship: footer notice, per-image `credit` via `MdxFigcaption`, and a
  `BlogPosting` + `ImageObject` JSON-LD on editorial articles only (see §7).
- `lib/site.ts` as the single source of the absolute base URL, consumed by `sitemap.ts`,
  `robots.ts`, `metadataBase` and every JSON-LD block.
- Icons: `lucide` for icon data plus `morphicons` for spring-interpolated transitions
  (the nav hamburger ↔ close morph).

Content written so far: **6 projects, 4 case studies, 3 articles**. No placeholders remain — every
`.mdx` in `content/` has a real body. The three articles cover one section each
(`career`, `software`, `aotearoa`), which is the premise the §5 routing decision rests on.

---

## 3. Stack and technical decisions (already made, do not reopen without cause)

- **Next.js App Router** (not Pages Router) — currently Next 16 / React 19.
- **MDX with front matter** for all content (projects, articles, case studies),
  read with `gray-matter` and rendered with `next-mdx-remote`.
- **Tailwind CSS v4**, CSS-first config (`@theme inline` in `app/globals.css`, no `tailwind.config`),
  plus `@tailwindcss/typography` for MDX prose.
- Theming with **next-themes**, using `attribute="data-theme"`.
- Package manager: **pnpm**.
- Content lives in `.mdx` files, kept separate from route code.
- Icons come from **`lucide`** (icon *data*, not `lucide-react` components) so `morphicons` can
  interpolate their geometry. Both packages tree-shake and may coexist; see LEARNING.md for why a
  morph cannot consume a rendered React component.
- Structured data is hand-built JSON-LD in plain `<script type="application/ld+json">` tags —
  not `next/script`, and not the Metadata API, which has no field for it.

---

## 4. Design system (already defined and validated)

**Palette — teal petrol** (WCAG AA contrast verified in light and dark):

- Accent light mode: `#0C5566`
- Accent dark mode: `#4D9FB3`

Strict colour rule: **accent appears ONLY in links, kickers, pills, and CTAs.**
Never in body text or full headings.

Full token set (background, foreground, surface, ink-soft, ink-faint, line, accent, accent-soft,
on-accent) is defined in `app/globals.css` for both themes. Use the Tailwind utilities that map to
them (`bg-surface`, `text-ink-soft`, `border-line`, `text-accent`…) instead of raw hex values, so
theming keeps working.

**Typography — three-family system:**

- **Source Serif 4** -> headings and humanist voice (never coloured).
- **Inter** -> UI and body reading.
- **JetBrains Mono** -> kickers, metadata, and code.

**Logo:** interlocked EB monogram, monochrome SVG (single-ink, scalable).

- Dark-ink variant (`#20221a`) for light backgrounds.
- Cream/light variant (`#fafafa`) for dark backgrounds.
- Embedded with theme adaptation (`<picture>` pattern or `currentColor`).

---

## 5. Site architecture (validated — do NOT reopen)

### Route map

- `Home` (/) — static.
- `Portfolio` (/portfolio) — listing. Conceptual sub-levels: selected projects,
  technical experiments, case studies.
- `Editorial` (/editorial) — listing with **three subsections as THEIR OWN ROUTES**:
  - `/editorial/software` — technical articles.
  - `/editorial/career` — Career & Migration: identity, craft, transition.
  - `/editorial/aotearoa` — Life in Aotearoa: life in NZ, travel, Southland.
- `About` (/about) — static, scroll sections.
- `Contact` — **NOT a navigable route**. Lives as a CTA in the nav and a block in the footer.
- Case studies at `/case-studies/[slug]` — standalone routes, linked from project cards.

### Navigation

- Nav with three items: **Portfolio, Editorial, About**.
- The logo links to Home.
- **Resume** prominent in the footer.

### Key Editorial decision
**Own routes** were chosen (not filters) for the three subsections, because each is a
distinct facet of the professional identity aimed at a distinct audience, and being able
to link `/editorial/career` or `/editorial/software` separately has value. Elías confirmed
he will feed all three regularly.

**Technical caveat:** in `app/editorial/`, fixed routes (`software`, `career`, `aotearoa`)
coexist with the dynamic `[slug]`. App Router prioritises the fixed ones. Reserve those
three names as forbidden article slugs, so an article does not get shadowed.

---

## 6. Folder structure (as built)

```text
elibabah-web/
  app/
    layout.tsx              # root layout: fonts, theme provider, nav, footer, JSON-LD
    page.tsx                # Home (/)
    globals.css             # design tokens + prose theming (no separate styles/ folder)
    not-found.tsx
    sitemap.ts, robots.ts, opengraph-image.tsx, icon.svg
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
    layout/                 # Nav, Footer, Logo, ThemeToggle
    content/                # MdxImage, MdxImageRow, MdxVideo, MdxFigcaption
    theme-provider.tsx
  content/
    portfolio/*.mdx
    editorial/*.mdx
    case-studies/*.mdx
  lib/                      # content <-> app bridge
    portfolio.ts, editorial.ts, case-studies.ts
    mdx-components.tsx      # MDX -> React component mapping
    image-slots.ts          # aspect ratios, responsive widths/sizes, export dimensions
    reading-time.ts         # reading time derived from the MDX body
    site.ts                 # SITE_URL — single source for absolute URLs
  public/
    images/{portfolio,editorial,case-studies}/<slug>/…
    videos/portfolio/<slug>/…
    logo-light.svg, logo-dark.svg, resume.pdf
```

Structure decisions made:

- **`components/` at the root** (not inside `app/`), to separate routes from reusable UI.
- `Contact` has no folder: it is a component in the layout (CTA in nav + block in footer).
- `case-studies` only has `[slug]`, no index `page.tsx` (not a navigable section).
- `[slug]` dynamic route: one folder serves all items; growing = adding a new `.mdx`.
- The planned `styles/` folder was **not** created: tokens and global CSS live in `app/globals.css`,
  since Tailwind v4 configures the theme from CSS anyway.

---

## 7. Content models (front matter, as implemented)

Source of truth are the TypeScript types in `lib/portfolio.ts`, `lib/case-studies.ts` and
`lib/editorial.ts` — if this section and those types disagree, the types win.

Image fields are **not** a generic `cover`: each one names a slot defined in `lib/image-slots.ts`,
so the aspect ratio and `sizes` are decided once, not per page. Files live under
`public/images/<collection>/<slug>/`.

### Project — `content/portfolio/[slug].mdx`

```yaml
title: string
slug: string
summary: string        # 1-2 lines for the card
stack: string[]        # ['React','TypeScript','Lit']
role: string           # role in the project
year: number
featured: boolean      # shows on Home
links:
  demo: url | null
  repo: url | null
caseStudy: slug | null # link to the case study if it exists
cardThumb: path | null # home featured cards + /portfolio listing cards
heroBand: path | null  # wide hero at the top of /portfolio/[slug]
relatedThumb: path | null  # square mini-card in editorial cross-links
```

### Case Study — `content/case-studies/[slug].mdx`

```yaml
title: string
slug: string
project: slug          # the project it expands on
problem: string        # the starting challenge
role: string
stack: string[]
outcome: string        # impact / learning
```

The body (problem, decisions, alternatives, outcome) is the MDX content itself, not a
front-matter field. Case studies currently have **no image field**; they reuse the
narrative and body images.

`readingTime` is **not** a front-matter field: it is derived from the body by
`lib/reading-time.ts` when the file is read. Do not declare it — it would be ignored.

### Article (Editorial) — `content/editorial/[slug].mdx`

```yaml
title: string
slug: string
section: enum          # 'software' | 'career' | 'aotearoa'
excerpt: string        # for the listing
publishedAt: date      # quoted ISO string, e.g. "2026-05-15"
relatedProject: slug | null      # cross-link to the portfolio
heroBand: path | null
heroAlt: string | undefined      # real description of the photo; falls back to title
heroCredit: string | undefined   # display string, e.g. "Photo: Elías Hernández"
heroCaption: string | undefined  # place / context line under the band
```

Same as case studies: `readingTime` is derived, not declared.

The three `hero*` companions are optional (`?:`, not `| null`) because they were added after the
first articles existed and those files do not declare them. `gray-matter` simply omits the key.

The models include **cross-linking** fields (`caseStudy` on a project, `relatedProject` on an
article) to weave portfolio, case studies, and editorial together. There is no
`relatedCaseStudy` on articles — an article reaches a case study through its project.

### Authorship and image credit

Images on this site do not all belong to the same person, and the collections differ in *how*
they differ:

- **Editorial** — photographs are Elías's own, taken by him. Not stock, not AI-generated.
- **Portfolio** — **mixed ownership, item by item.** Most projects so far are professional work
  where the client owns the brand, content, and often the design; screenshots show work done, not
  work owned. But some projects are 100% personal and Elías owns them outright, and there will be
  more. There is no blanket statement that holds for the whole collection — credit is decided per
  project, never inferred from the folder.

Three mechanisms carry this, from broadest to narrowest:

1. **Global notice in the footer** — one mono line, no second `©` (the copyright line above it
   already carries one). Covers the default case so individual images do not have to.
2. **Per-image credit via `MdxFigcaption`** — it takes `caption`, `credit`, `sourceLabel` +
   `sourceHref` and stacks up to three lines (`space-y-1`), all optional, returning `null` when
   none are present. `MdxImage`, `MdxImageRow` and `MdxVideo` all accept `credit` and forward it;
   the `/editorial/[slug]` hero band uses the same component with `heroCaption` / `heroCredit`.
3. **JSON-LD `ImageObject`** — machine-readable authorship, see below.

Copyright is automatic from the shutter, so none of this creates rights that did not exist. It
exists to communicate authorship to readers and crawlers. Note that Next's image optimiser
**strips EXIF/IPTC** when it converts to WebP/AVIF, so embedded metadata in the source file never
reaches the visitor — only what is rendered on the page counts.

### JSON-LD scope — editorial only, on purpose

`app/layout.tsx` emits a `Person` node with a stable `@id` (`${SITE_URL}/#elias`). Because the
layout wraps every route, that node is always present and can be referenced by `@id` from any
page-level block; consumers merge nodes by `@id` within a single page.

`app/editorial/[slug]/page.tsx` emits a `BlogPosting` whose `author`/`creator` point at that
`@id`, with a nested `ImageObject` for the hero band carrying `creditText` and `copyrightNotice`.

**Portfolio and case studies deliberately have no `ImageObject`.** A hardcoded
`copyrightNotice: "© Elías Hernández"` would be false for client work, and since portfolio
ownership is mixed per project (above), the collection cannot be covered by one rule. Extending
this to portfolio requires an explicit per-project ownership field first — do not add it by
pattern-matching the editorial code.

Editorial is safe to cover uniformly because it contains no client screenshots and no sensitive
project material. Articles may *link* to a project, but that is a cross-reference (`relatedProject`),
not an embedded asset, and it carries no image rights with it.

Three conventions baked into the current implementation, all worth knowing before touching it:

- **`license` and `acquireLicensePage` are omitted on purpose.** They are the fields behind
  Google's image-licensing feature: including them advertises that the photos can be licensed or
  bought, which is the opposite of the intent. Their absence is a decision, not an oversight.
  If a terms-of-use page ever exists, `license` would point at it.
- **`heroCredit` is not reused as `creditText`.** The front-matter value is a display string with a
  prefix ("Photo: …"); `creditText` takes the bare name so aggregators can format it themselves.
- **"An editorial hero is Elías's own photo" is assumed**, and the copyright fields are emitted
  whenever `heroBand` exists. The day an article uses someone else's photograph, that assumption
  produces a false claim — add an explicit ownership flag then rather than editing the string.

---

## 8. Build order (completed)

1. ~~**Base layout + tokens**~~ — root layout, theme provider, design tokens, nav and footer. ✅
2. ~~**Home**~~ — hero, Featured Work, Latest from the Editorial. ✅
3. ~~**Portfolio**~~ — listing + `[slug]` route reading from MDX. ✅
4. ~~**Case Study**~~ — `[slug]` route, linked from project cards. ✅
5. ~~**Editorial**~~ — index + three subsections + `[slug]` route. ✅
6. ~~**About**~~ — static with scroll sections. ✅

Contact (CTA + footer) was integrated into the layout in step 1, not as a separate step.

The scaffolding phase is over. Work from here is **refinement and content**. Where that stands:

- Real content is written for all 6 projects, 4 case studies and 3 articles — no placeholders left.
- Authorship, credit and JSON-LD are in place for editorial (§7). Extending structured data to
  portfolio needs a per-project ownership field first, and is deliberately not done yet.
- Still open: the Spanish epigraph has **no home on the site yet** (§1) — the Home hero currently
  runs the English headline. Candidates remain Home hero, About, or footer.
- Still open: image credit exists as a mechanism but no `.mdx` body uses the `credit` prop yet; the
  first article with its own photographs inside the body will be the one to exercise it.

---

## 9. How to work with Claude on this project

- **Elías writes the code.** Claude guides architecture, reviews, explains trade-offs,
  unblocks, and proposes approaches. It does not implement by default.
- Never work directly on `main`: it is protected and the flow is branch -> PR -> preview -> merge.
- `LEARNING.md` is an **append-only** notebook (in Spanish) of concepts learned while building.
  Claude proposes topics, Elías writes them, Claude reviews afterwards. Nothing is deleted;
  outdated entries get annotated as such.
- When adding content, adding a `.mdx` file is enough — no code changes. Remember the reserved
  editorial slugs (`software`, `career`, `aotearoa`).
- When adding images, pick the slot from `lib/image-slots.ts` and export at the dimensions it
  recommends, instead of inventing sizes per page.
