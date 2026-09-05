# elibabah-web

Source code for [elibabah.com](https://elibabah.com) — the personal site of **Elías Hernández** (`Elibabah`), a frontend engineer based in New Zealand.

It is not a pure portfolio nor a pure blog: it is both, woven together, plus a research shelf. Projects link to case studies, case studies link back to projects, and editorial articles cross-link to the work that inspired them. Academic work lives in its own collection, published in full with one downloadable PDF per language edition.

---

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (CSS-first config, `@theme inline`) + `@tailwindcss/typography` |
| Content | MDX with YAML front matter, rendered via `next-mdx-remote` + `gray-matter`, with `remark-gfm` for tables and the rest of GitHub-flavoured Markdown |
| Theming | `next-themes` with `attribute="data-theme"` |
| Fonts | `next/font/google` — Source Serif 4, Inter, JetBrains Mono (a local `.ttf` copy of Source Serif 4 lives in `public/fonts/` for the OG images) |
| Social cards | `next/og` `ImageResponse` — a site-wide card plus per-article and per-research-work cards |
| Icons | `lucide` (icon data) + `morphicons` (spring-interpolated transitions) |
| Images | `image-size` reads intrinsic dimensions at build time, so MDX images need no width/height |
| Analytics | `@vercel/analytics`, `@vercel/speed-insights` |
| Package manager | pnpm |
| Hosting | Vercel (apex `elibabah.com`; `www` redirects to apex) |

---

## Getting started

```bash
pnpm install
pnpm dev      # http://localhost:3000
```

Other scripts:

```bash
pnpm build    # production build
pnpm start    # serve the production build
pnpm lint     # eslint
```

No environment variables are required to run the site locally.

---

## Project structure

```text
app/
  layout.tsx              # root layout: fonts, theme provider, nav, footer, JSON-LD
  page.tsx                # Home (/)
  portfolio/
    page.tsx              # /portfolio — listing
    [slug]/page.tsx       # /portfolio/<project>
  editorial/
    page.tsx              # /editorial — general index
    software/page.tsx     # /editorial/software
    career/page.tsx       # /editorial/career
    aotearoa/page.tsx     # /editorial/aotearoa
    [slug]/page.tsx       # /editorial/<article>
    [slug]/opengraph-image.tsx
  case-studies/
    [slug]/page.tsx       # /case-studies/<case> — no index, reached from project cards
  research/
    page.tsx              # /research — listing
    [slug]/page.tsx       # /research/<work>
    [slug]/opengraph-image.tsx
  about/page.tsx          # /about
  cv/
    page.tsx              # /cv — the CV as a page; offers cv.pdf
    cv.module.css         # scoped styles, including the print stylesheet
  globals.css             # design tokens + prose theming
  sitemap.ts, robots.ts, opengraph-image.tsx, icon.svg, not-found.tsx

components/
  layout/                 # Nav, Footer, Logo, ThemeToggle
  content/                # MdxImage, MdxImageRow, MdxVideo, MdxFigcaption,
                          # MdxMermaid, MdxPre, MdxTable
  theme-provider.tsx

content/                  # all site content, as MDX
  portfolio/*.mdx
  case-studies/*.mdx
  editorial/*.mdx
  research/*.mdx

lib/                      # bridge between content/ and app/
  portfolio.ts            # read + parse portfolio front matter
  case-studies.ts
  editorial.ts
  research.ts             # research works + their language editions
  mdx-components.tsx      # MDX -> React component mapping + shared remark-gfm options
  image-slots.ts          # canonical image aspect ratios / widths / sizes / export dimensions
  reading-time.ts         # reading time derived from the MDX body
  site.ts                 # SITE_URL (sitemap, robots, JSON-LD) + CV_PATH / CV_PDF_PATH

thesis/                   # sources for the research PDFs — not served, not in public/
  build.sh                # rebuilds both editions: ./thesis/build.sh [all|es|en|covers]
  GLOSSARY.md             # binding English terminology for the translation
  en/*.md                 # the English translation, source of truth for that edition
  source/                 # the deposited UNAM PDF, untouched
  build/                  # typst covers and intermediates (regenerable)

public/
  images/{portfolio,editorial,case-studies,research}/<slug>/…
  videos/portfolio/<slug>/…
  thesis/*.pdf            # research editions, one PDF per language
  fonts/                  # Source Serif 4, read at build time by the OG images
  cv.pdf                  # canonical CV file; old filenames 308 to it
```

Three structural decisions worth knowing:

- **`components/` lives at the repo root**, outside `app/`, to keep routes and reusable UI separate.
- **The three editorial subsections are real routes, not filters.** Each targets a distinct audience and deserves its own linkable URL. Since fixed segments coexist with `[slug]` inside `app/editorial/`, the slugs `software`, `career` and `aotearoa` are **reserved** and must never be used for an article — App Router would shadow it.
- **Research is a fourth collection, and a fourth nav item** (Portfolio · Editorial · Research · About). It earned one because research stopped being a single artifact: the UNAM thesis ships in Spanish and English, and the Master of Applied Management thesis will follow. One document would have belonged inside About; a growing body of work does not.

Contact is deliberately not a route: it lives as a CTA in the nav and a block in the footer, alongside the CV link.

**The CV is a page, not just a file.** `/cv` is the canonical destination the site links to: indexable, keyboard-accessible, themed, and carrying its own print stylesheet so a recruiter who prints it gets the document without the site chrome. `/cv.pdf` is offered from it. Old résumé URLs (`/resume.pdf`, `/Elias_Hernandez_Frontend_Resume.pdf`, `/resume`) are permanently redirected.

---

## Content model

Content is authored as MDX with front matter; publishing means adding a file, not changing code.

**Project** — `content/portfolio/<slug>.mdx`

```yaml
title: string
slug: string
summary: string          # 1–2 lines, used on cards
stack: string[]
role: string
year: number
featured: boolean        # surfaces on Home
links: { demo: url|null, repo: url|null }
caseStudy: slug|null     # link to its case study
cardThumb: path|null     # listing / home card image
heroBand: path|null      # wide hero image
relatedThumb: path|null  # square thumb used in editorial cross-links
```

**Case study** — `content/case-studies/<slug>.mdx`

```yaml
title: string
slug: string
project: slug            # the project it expands on
problem: string
role: string
stack: string[]
outcome: string
```

**Article** — `content/editorial/<slug>.mdx`

```yaml
title: string
slug: string
section: 'software' | 'career' | 'aotearoa'
excerpt: string
publishedAt: date        # quoted ISO string
relatedProject: slug|null
heroBand: path|null
heroAlt: string?         # real description of the photo; falls back to the title
heroCredit: string?      # e.g. "Photo: Elías Hernández"
heroCaption: string?     # place / context line under the band
```

**Research work** — `content/research/<slug>.mdx`

```yaml
title: string            # display title, in English
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
cover: path?             # documentCover slot — portrait, see lib/image-slots.ts
coverAlt: string?
editions:                # one entry per language the work exists in
  - lang: string         # ISO code
    label: string        # as shown: 'English', 'Spanish'
    file: path           # PDF under public/thesis/
    pages: number
    primary: boolean?    # the language it was written in
```

The model is **one work, N language editions**. A work with a single edition renders correct copy
with no configuration; adding a translation is a front-matter entry, not a code change. Covers are
generated from page 1 of the PDF rather than drawn by hand:

```bash
pdftoppm -f 1 -l 1 -r 150 -png -singlefile work.pdf cover
magick cover.png -resize 660x -bordercolor '#e2e3df' -border 1 -quality 88 cover.jpg
```

`readingTime` is not declared anywhere: it is derived from the MDX body by [lib/reading-time.ts](lib/reading-time.ts) as the file is read, so it can never drift from the text.

Images referenced from front matter live under `public/images/<collection>/<slug>/`. The canonical aspect ratio, responsive width, `sizes` attribute and recommended export dimensions for every image slot are defined once in [lib/image-slots.ts](lib/image-slots.ts) — use it instead of hardcoding values.

### Image credit

Editorial photographs are Elías's own. Portfolio imagery is mixed: most projects are professional work whose brand and content belong to the client, some are entirely personal. Ownership is therefore decided per item, never inferred from the collection.

Credit is carried at three levels: a global notice in the footer, an optional per-image `credit` line rendered by `MdxFigcaption` (alongside `caption` and an optional source link), and a JSON-LD `ImageObject` on editorial articles.

Structured data is a graph, not a per-page tag: the root layout emits a `Person` node with a stable `@id`, and page-level blocks reference it by that `@id` rather than duplicating the node — `/editorial/[slug]` emits a `BlogPosting`, `/research/[slug]` a `Thesis` with one `MediaObject` per language edition. Research is safe to describe this way for the same reason portfolio is not: a thesis is wholly the author's own work. Portfolio and case studies deliberately emit no `ImageObject` — a single hardcoded copyright notice cannot be true for a collection with mixed ownership. See §7 of [CLAUDE.md](CLAUDE.md) for the full rationale, including which schema.org fields are omitted on purpose.

---

## Design system

**Palette — teal petrol** (AA contrast verified in both themes). Tokens are declared as CSS variables in [app/globals.css](app/globals.css) and exposed to Tailwind through `@theme inline`, so utilities like `bg-surface`, `text-ink-soft`, `border-line` and `text-accent` follow the active theme automatically.

| Token | Light | Dark |
| --- | --- | --- |
| `background` | `#F6F7F6` | `#121514` |
| `foreground` | `#15160F` | `#ECEEEA` |
| `surface` | `#FFFFFF` | `#1A1E1D` |
| `line` | `#DEE3E2` | `#2A2F2E` |
| `accent` | `#0C5566` | `#4D9FB3` |

> **Colour rule:** the accent appears **only** in links, kickers, pills and CTAs — never in body text or full headings.

Typography is a three-family system, one job each:

- **Source Serif 4** — headings and humanist voice (never coloured).
- **Inter** — UI and body reading.
- **JetBrains Mono** — kickers, metadata and code.

**Theming** is driven by `next-themes` writing `data-theme` on `<html>`; dark values override the defaults under `html[data-theme="dark"]`.

**Logo:** interlocked EB monogram, single-ink SVG. It is one path inlined in the `Logo` component and painted with `currentColor`, so it inherits `--foreground` and follows the theme in CSS — no second file, no JavaScript, and no flash of the wrong variant before hydration.

---

## Deployment

Deployed on Vercel with CI/CD wired to GitHub:

- push to `main` → production deploy to `elibabah.com`
- branches and pull requests → preview deployments

`main` is protected (deletions restricted, force pushes blocked), so the flow is **branch → PR → preview → merge**.

---

## Repo conventions

- [LEARNING.md](LEARNING.md) — append-only technical notebook (in Spanish) of concepts learned while building the site. Nothing is deleted; outdated entries are annotated rather than removed.
- [CLAUDE.md](CLAUDE.md) — project handoff and working agreement: architecture decisions, design system and build order. Read it before reopening a settled decision.
