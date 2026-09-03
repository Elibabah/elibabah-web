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
("I build fast, accessible web apps with React and TypeScript."), rewritten from the earlier
"Building software with intention" to lead with the capability a recruiter scans for. Still
pending a decision on where the epigraph lands — Home hero, About, or footer.

---

## 2. Current state (as of August 2026)

Infrastructure:

- Repo: **`elibabah-web`** (GitHub: `Elibabah/elibabah-web`), **pnpm**.
- Deployed on **Vercel** with custom domain **elibabah.com** (apex); `www` redirects to apex.
- **CI/CD active**: push to `main` deploys to production; branches and PRs generate Preview Deployments.
- `main` branch protected with a ruleset (restrict deletions, block force pushes).

The site is built and live. All routes from the architecture in §5 exist:

- Home with hero, an "At a glance" facts strip, Featured Work and Latest from the Editorial.
- `/portfolio` listing + `/portfolio/[slug]`.
- `/editorial` index + `/editorial/software`, `/career`, `/aotearoa` + `/editorial/[slug]`.
- `/research` listing + `/research/[slug]`.
- `/case-studies/[slug]`.
- `/about`.

Also in place:

- Root layout with the three fonts via `next/font/google`, `ThemeProvider`, Nav (with mobile menu),
  Footer, and Person JSON-LD (with a stable `@id`, referenced from page-level blocks).
- Design tokens as CSS variables in `app/globals.css`, exposed to Tailwind v4 via `@theme inline`.
- Theme toggle (`next-themes`, `data-theme`), light/dark palettes.
- Contact as an anchor: nav CTA `#contact` → `<footer id="contact">` with `mailto:elias@elibabah.com`,
  LinkedIn, GitHub and the résumé (`RESUME_PATH` in `lib/site.ts`).
- SEO/ops: `sitemap.ts` (all four collections), `robots.ts`, `icon.svg`, `not-found.tsx`,
  Google site verification, Vercel Analytics and Speed Insights.
- Social cards with `next/og`: a site-wide `app/opengraph-image.tsx` plus per-item cards at
  `app/editorial/[slug]/` and `app/research/[slug]/`, prerendered via `generateStaticParams`.
- MDX pipeline: `gray-matter` for front matter, `next-mdx-remote` for the body,
  `lib/mdx-components.tsx` for the component mapping **and** the shared `remark-gfm` options.
- Image system: `lib/image-slots.ts` as the single source of aspect ratios, responsive widths,
  `sizes` and recommended export dimensions. Intrinsic dimensions are read at build time with
  `image-size`, so MDX images never declare width/height by hand.
- Reading time derived from the body in `lib/reading-time.ts`, not declared per file.
- Image credit and authorship: footer notice, per-image `credit` via `MdxFigcaption`, and a
  `BlogPosting` + `ImageObject` JSON-LD on editorial articles only (see §7). `/research/[slug]`
  emits a `Thesis` node with one `MediaObject` per language edition.
- `lib/site.ts` as the single source of the absolute base URL, consumed by `sitemap.ts`,
  `robots.ts`, `metadataBase` and every JSON-LD block.
- Icons: `lucide` for icon data plus `morphicons` for spring-interpolated transitions
  (the nav hamburger ↔ close morph).

Content written so far: **6 projects, 4 case studies, 3 articles, 1 research work**. No
placeholders remain — every `.mdx` in `content/` has a real body. The three articles cover one
section each (`career`, `software`, `aotearoa`), which is the premise the §5 routing decision
rests on. The research work is the UNAM thesis, shipped in both its Spanish original and the
English translation.

---

## 3. Stack and technical decisions (already made, do not reopen without cause)

- **Next.js App Router** (not Pages Router) — currently Next 16 / React 19.
- **MDX with front matter** for all content (projects, articles, case studies),
  read with `gray-matter` and rendered with `next-mdx-remote`.
- **`remark-gfm` is not optional, and its absence is silent.** MDX on its own is CommonMark,
  which has no tables: without the plugin a `| a | b |` table parses as a paragraph and renders
  as a wall of literal pipes, with no build error and nothing in the console. Strikethrough, task
  lists, footnotes and bare autolinks fail the same way. The plugin list is exported as
  `mdxOptions` from `lib/mdx-components.tsx`, next to the component map, and **every**
  `MDXRemote` call site passes it. A new collection that copies a page but forgets
  `options={mdxOptions}` will look fine until the first table.
- **GFM tables get their own scroll panel** (`MdxTable`, mapped over `table`). A three-column
  table of prose is around 576px and the article column on a phone is about 325px, so the same
  rule as diagrams applies: the table pans inside itself rather than pushing the page into a
  horizontal scroll, with `tabIndex={0}` for WCAG 2.1.1 and `overscroll-x-contain` so panning
  does not fire the back gesture. Unlike a diagram it is never scaled down; shrinking type is not
  an option for something read cell by cell. The table's own `prose` margin is killed with
  Tailwind's `!` modifier, because `@tailwindcss/typography` styles it at `.prose :where(table)`,
  which outranks a plain utility class; without that there are 29px of dead space inside the
  border.
- **Tailwind CSS v4**, CSS-first config (`@theme inline` in `app/globals.css`, no `tailwind.config`),
  plus `@tailwindcss/typography` for MDX prose.
- Theming with **next-themes**, using `attribute="data-theme"`.
- Package manager: **pnpm**.
- Content lives in `.mdx` files, kept separate from route code.
- Icons come from **`lucide`** (icon *data*, not `lucide-react` components) so `morphicons` can
  interpolate their geometry. Both packages tree-shake and may coexist; see LEARNING.md for why a
  morph cannot consume a rendered React component.
- **Diagrams are Mermaid, rendered in the browser.** Authoring is a plain ```` ```mermaid ````
  fence in the `.mdx`, identical to a repo README, so a diagram already written for a project's
  README moves across unedited. `MdxPre` intercepts the fence at the `<pre>` level and hands it to
  `MdxMermaid`, a client component that `await import("mermaid")` from inside its effect — which
  puts the library in its own chunk, downloaded only on pages that actually contain a diagram.
  That is roughly 400KB gzip, lazily, below the fold, and it is the one place on the site where
  content ships client JavaScript. The alternative, `rehype-mermaid`, renders to static SVG at
  build time but pulls **Playwright** into every Vercel deploy; Mermaid measures text with
  `getBBox`, so there is no browserless renderer and no third option. If the JS cost ever stops
  being worth it, the fences do not change — only where they are rendered.
- **Mermaid is themed from the tokens, not from a preset.** `MdxMermaid` resolves the CSS
  variables against the live document and feeds them to `themeVariables`, re-reading them when
  `resolvedTheme` changes, because Mermaid derives colours with khroma and needs real values.
  Two consequences, both learned the hard way:
  - **`classDef fill:var(--x)` is a Mermaid parse error.** So the component resolves every
    `var(--token)` in the diagram source *before* Mermaid sees it. In an `.mdx` you therefore
    write `classDef pure fill:var(--accent-soft),stroke:var(--color-accent)` and it works — but
    only the no-fallback form: `var(--x, #fff)` would break on Mermaid's comma-separated
    declarations. An unknown token is left untouched rather than blanked, so a typo fails loudly.
  - `--diagram-pass{,-line}` and `--diagram-fail{,-line}` in `app/globals.css` exist **only** for
    this. They are the one extension to the §4 palette, they are never used for text, and they
    are defined for both themes. Reach for accent before adding a third pair.
- `securityLevel` is `"strict"`, and `<b>`, `<i>` and `<br/>` in node labels still render —
  verified, not assumed. There is no need to rewrite README labels into markdown strings.
- **A diagram is never scaled down to fit.** `max-width: 100%` is what made wide flowcharts
  unreadable on a phone: a 1180px diagram in a 360px column drew its 16px type at about 6px, and
  `overflow-x-auto` never engaged because nothing overflowed. `MdxMermaid` reads the natural width
  off the SVG's `viewBox` and sets the width itself — fit-to-column, floored at `MIN_FIT_SCALE`
  (0.7, the point where the type drops under ~11px). Past that the panel scrolls, and a zoom
  control (50–250% in 25% steps, plus Fit) and Expand sit above every diagram, always. Showing
  them only when the diagram overflowed was tried and reverted: the condition flips on the *same*
  diagram when a phone is rotated, so the controls came and went, and it hid Expand on exactly
  the diagrams a reader might still want full screen. Whether to enlarge is the reader's call,
  not a threshold's. Only the "Scroll to pan" hint stays conditional, because it would otherwise
  be false. The scroll panel carries `tabIndex={0}` because a
  region that scrolls and cannot be reached by keyboard is a WCAG 2.1.1 failure, and
  `overscroll-x-contain` so panning does not trigger the browser's back gesture.
  **Measure the content box, not `clientWidth`** — `clientWidth` includes the panel's own `p-7`,
  and comparing against it overflows every diagram by 56px.
- **Full screen, offered on every diagram.** `Expand` opens a native `<dialog>` via
  `showModal()`, which is what buys the focus
  trap, the inert background, Esc-to-close and `::backdrop` without writing any of them.
  The dialog takes the **whole viewport** (`w-screen h-[100dvh]`, opaque `bg-background`, no
  card inside it) rather than floating at 96vw. That was a deliberate revision: a floating panel
  left a dimmed strip of page around it that read as visual noise and gave the diagram no real
  room. Covering the page outright removes the backdrop as something to look at, which is why
  there is no blur to tune — and it is the only version that helps on a phone.
  The dialog holds a second `DiagramSurface` that measures and zooms independently, because the
  room it gets is nothing like the article column. Four things that are easy to get wrong:
  - **Full screen fits both axes**, the article fits width only. Fitting width alone in a
    full-screen dialog just trades horizontal scrolling for vertical and defeats the point: on a
    1440×900 screen the widest diagram lands at 80% with *no scrolling in either direction*.
  - The floor stays `MIN_FIT_SCALE` in both. Going lower full screen was tried and reverted —
    on a phone a wide diagram overflows at any scale that small anyway, so it cost legibility
    (8px type at 50%) and bought no overview at all.
  - The copy in the dialog is **re-ided** (`svg.replaceAll(domId, domId + "-full")`). Mermaid
    scopes the diagram's own CSS *and* its arrowhead `url()` references by element id, so two
    live copies sharing an id collide.
  - Style the dialog with `[&[open]]:flex`, never a bare `flex`. A plain `display:flex` beats the
    UA's `dialog:not([open]) { display: none }` and leaves the dialog permanently on screen.

  `document.body.style.overflow` is locked while open: Chrome still scrolls the page behind a
  modal, which is disorienting when the thing you are panning is itself scrollable. There is no
  click-outside handler, because full screen there is no outside.
- **The width effect has no dependency array, on purpose — do not "fix" it.** React owns the SVG
  subtree through `dangerouslySetInnerHTML`, so a commit that recreates the panel rebuilds the
  `<svg>` from the HTML string and silently drops the inline width set on the previous node,
  *without changing anything a dependency array could watch*. The trigger we hit was the controls
  row appearing above the panel once the widths were measured: a new sibling changes the child
  list, React rebuilds the panel under it, and the diagram sticks at the SVG's 300px intrinsic
  default — intermittently, which is what made it hard to see. The controls row being
  unconditional now settles that on its own, but the effect still re-applies after every commit,
  because the same trap waits for the next conditional child anyone adds above the panel. It is
  two style writes on a cached element and it cannot go stale.
- Structured data is hand-built JSON-LD in plain `<script type="application/ld+json">` tags —
  not `next/script`, and not the Metadata API, which has no field for it.
- **Social cards are generated, not designed**: `next/og` `ImageResponse` at build time, one
  card per editorial article and per research work on top of the site-wide one. `ImageResponse`
  cannot read a `next/font` object, so Source Serif 4 is *also* kept as a raw `.ttf` in
  `public/fonts/` and passed as a buffer. That duplicate file is deliberate, not a leftover.

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

- **One path, inlined in `components/layout/Logo.tsx`, painted with `currentColor`** and
  inheriting from `text-foreground`, so the mark follows the theme in CSS with no JavaScript.
- This replaced two files (`logo-light.svg` / `logo-dark.svg`) swapped by a client component
  reading `resolvedTheme`, which needed a `mounted` flag and an effect and still flashed the
  light logo before hydration. The two files turned out to be byte-identical apart from the
  fill, so the swap was never buying anything. `Logo` is a Server Component again.
- Consequence worth knowing: the ink is now exactly `--foreground` (`#15160F` / `#ECEEEA`),
  not the older hardcoded `#20221a` / `#fafafa`. Those were the previous palette's foreground
  values, so this is the mark tracking the tokens rather than drifting from them.
- The two `.svg` files were **deleted** once the inline path replaced them (August 2026). They
  remain in git history if the artwork is ever needed again.

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
- `Research` (/research) — listing + `/research/[slug]`. Academic work published in full,
  each item carrying one or more **language editions** as PDFs.
- `About` (/about) — static, scroll sections.
- `Contact` — **NOT a navigable route**. Lives as a CTA in the nav and a block in the footer.
- Case studies at `/case-studies/[slug]` — standalone routes, linked from project cards.

### Navigation

- Nav with four items: **Portfolio, Editorial, Research, About**.
- The logo links to Home.
- **Resume** prominent in the footer.

### Key Research decision (August 2026)

`/research` was added as a fourth collection and a fourth nav item, reopening the three-item nav
this section had settled. The reason is scale: research stopped being one artifact. The UNAM
thesis ships in Spanish and English, and the Master of Applied Management thesis will follow,
which is directly relevant to the New Zealand professional audience the site is aimed at. A
single artifact would have been better hidden inside About; a growing body of work earns a
collection of its own.

The model is **one work, N language editions**. A work with a single edition renders correct
copy without configuration; adding a language is a frontmatter entry, not a code change.

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
    sitemap.ts, robots.ts, opengraph-image.tsx, icon.svg   # site-wide OG card
    portfolio/
      page.tsx              # /portfolio (listing)
      [slug]/page.tsx       # /portfolio/project
    editorial/
      page.tsx              # /editorial (general index)
      software/page.tsx     # /editorial/software
      career/page.tsx       # /editorial/career
      aotearoa/page.tsx     # /editorial/aotearoa
      [slug]/page.tsx       # /editorial/article
      [slug]/opengraph-image.tsx   # per-article social card
    case-studies/
      [slug]/page.tsx       # /case-studies/case (no index for now)
    research/
      page.tsx              # /research (listing)
      [slug]/page.tsx       # /research/work
      [slug]/opengraph-image.tsx   # per-work social card
    about/
      page.tsx              # /about
  components/               # reusable UI (root, outside app/)
    layout/                 # Nav, Footer, Logo, ThemeToggle
    content/                # MdxImage, MdxImageRow, MdxVideo, MdxFigcaption,
                            # MdxMermaid, MdxPre, MdxTable
    theme-provider.tsx
  content/
    portfolio/*.mdx
    editorial/*.mdx
    case-studies/*.mdx
    research/*.mdx
  thesis/                   # sources for the research PDFs — NOT served, not in public/
    build.sh                # rebuilds both editions; ./thesis/build.sh [all|es|en|covers]
    GLOSSARY.md             # binding EN terminology for the translation
    CORRECTIONS.md          # defects found in the original, deliberately unpublished
    source/                 # the deposited UNAM PDF, untouched
    en/*.md                 # the English translation, source of truth for that edition
    build/                  # *.typ title pages are tracked; the generated PDFs are ignored
  lib/                      # content <-> app bridge
    portfolio.ts, editorial.ts, case-studies.ts, research.ts
    mdx-components.tsx      # MDX -> React component mapping + shared remark-gfm options
    image-slots.ts          # aspect ratios, responsive widths/sizes, export dimensions
    reading-time.ts         # reading time derived from the MDX body
    site.ts                 # SITE_URL + RESUME_PATH — single source for both
  public/
    images/{portfolio,editorial,case-studies,research}/<slug>/…
    videos/portfolio/<slug>/…
    thesis/*.pdf          # research editions, one PDF per language
    fonts/                # raw Source Serif 4 .ttf, read by the OG images (see §3)
    Elias_Hernandez_Frontend_Resume.pdf   # the résumé; path lives in lib/site.ts
```

> **The résumé path is a constant, not a literal.** `RESUME_PATH` in `lib/site.ts` is the single
> source, imported by the Home hero CTA and the footer link. This is the fix for a real drift:
> there used to be two different PDFs (`resume.pdf` and this one) linked from those two places,
> so a visitor got a different CV depending on where they clicked. Nothing was broken, which is
> exactly why it went unnoticed. `resume.pdf` was deleted in August 2026. Never hardcode the path
> again — link it from the constant, the same way `SITE_URL` is treated.

Structure decisions made:

- **`components/` at the root** (not inside `app/`), to separate routes from reusable UI.
- `Contact` has no folder: it is a component in the layout (CTA in nav + block in footer).
- `case-studies` only has `[slug]`, no index `page.tsx` (not a navigable section).
- `[slug]` dynamic route: one folder serves all items; growing = adding a new `.mdx`.
- The planned `styles/` folder was **not** created: tokens and global CSS live in `app/globals.css`,
  since Tailwind v4 configures the theme from CSS anyway.

---

## 7. Content models (front matter, as implemented)

Source of truth are the TypeScript types in `lib/portfolio.ts`, `lib/case-studies.ts`,
`lib/editorial.ts` and `lib/research.ts` — if this section and those types disagree, the
types win.

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

### Research work — `content/research/[slug].mdx`

```yaml
title: string            # display title, English
originalTitle: string?   # title in the original language, when it differs
slug: string
kind: string             # 'Undergraduate thesis' | "Master's thesis" | …
field: string
institution: string
degree: string
year: number
advisor: string?
abstract: string         # listing card + page intro
featured: boolean
cover: path?             # documentCover slot (portrait; see lib/image-slots.ts)
coverAlt: string?
editions:                # one entry per language the work exists in
  - lang: string         # ISO code
    label: string        # as shown: 'Español', 'English'
    file: path           # under /public
    pages: number
    primary: boolean?    # the language it was written in
```

Covers are generated from page 1 of the PDF, not hand-made:

```bash
pdftoppm -f 1 -l 1 -r 150 -png -singlefile work.pdf cover
magick cover.png -resize 660x -bordercolor '#e2e3df' -border 1 -quality 88 cover.jpg
```

`/research/[slug]` emits a `Thesis` JSON-LD node whose `author` points at the Person `@id`, with
a `MediaObject` per edition. Unlike portfolio (see below), this is safe: a thesis is wholly the
author's own work, so there is no mixed-ownership problem.

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
7. ~~**Research**~~ — listing + `[slug]`, language editions, `Thesis` JSON-LD, per-work OG card. ✅

Contact (CTA + footer) was integrated into the layout in step 1, not as a separate step. Research
(step 7) came later than the rest and reopened the nav; the reasoning is in §5.

The scaffolding phase is over. Work from here is **refinement and content**. Where that stands:

- Real content is written for all 6 projects, 4 case studies, 3 articles and 1 research work —
  no placeholders left.
- Authorship, credit and JSON-LD are in place for editorial and research (§7). Extending
  structured data to portfolio needs a per-project ownership field first, and is deliberately
  not done yet.
- **Home is re-aimed at the recruiter** (shipped): the hero headline states the capability
  directly, the secondary CTA is "Download CV ↓" pointing at `RESUME_PATH` instead of a link to
  About, and a four-cell "At a glance" strip (role, stack, location, work status) sits under the
  hero. The strip is a local `facts` array in `app/page.tsx`, not content — if it grows or needs
  to change per audience, that is the moment to move it out.
- **The NZ Drive Practice project is positioned as the AI-assisted engineering exhibit.** Its
  `summary` leads with that role rather than with the product, because `summary` renders in full
  on both the Home featured card and the `/portfolio` listing and is most of what a recruiter
  reads. The body carries a "Built with AI, on purpose" section stating the dual intent, and it
  draws the distinction the `stack` line alone cannot: the product uses AI *and* the project was
  built with AI, which are different claims. Still missing, and only Elías can supply it: an
  account of **how** he actually works with AI day to day, which is the first thing an
  interviewer will ask after reading any of this.
- Still open: the Spanish epigraph has **no home on the site yet** (§1) — the Home hero currently
  runs the English headline. Candidates remain Home hero, About, or footer.
- Closed: the `credit` prop is exercised. `content/editorial/learning-the-quiet.mdx` carries a
  body `<Image … credit="Photo: Elías Hernández" />`, so the mechanism described in §7 is no
  longer theoretical.
- Next research work: the **Master of Applied Management thesis**, which is what the one-work /
  N-editions model in §7 was built to absorb without code changes.

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
