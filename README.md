# elibabah-web

Source code for [elibabah.com](https://elibabah.com) — the personal site of **Elías Hernández** (`Elibabah`), a frontend engineer based in New Zealand.

It is not a pure portfolio nor a pure blog: it is both, woven together. Projects link to case studies, case studies link back to projects, and editorial articles cross-link to the work that inspired them.

---

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (CSS-first config, `@theme inline`) + `@tailwindcss/typography` |
| Content | MDX with YAML front matter, rendered via `next-mdx-remote` + `gray-matter` |
| Theming | `next-themes` with `attribute="data-theme"` |
| Fonts | `next/font/google` — Source Serif 4, Inter, JetBrains Mono |
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
  case-studies/
    [slug]/page.tsx       # /case-studies/<case> — no index, reached from project cards
  about/page.tsx          # /about
  globals.css             # design tokens + prose theming
  sitemap.ts, robots.ts, opengraph-image.tsx, icon.svg, not-found.tsx

components/
  layout/                 # Nav, Footer, Logo, ThemeToggle
  content/                # MdxImage, MdxImageRow, MdxVideo
  theme-provider.tsx

content/                  # all site content, as MDX
  portfolio/*.mdx
  case-studies/*.mdx
  editorial/*.mdx

lib/                      # bridge between content/ and app/
  portfolio.ts            # read + parse portfolio front matter
  case-studies.ts
  editorial.ts
  mdx-components.tsx      # MDX -> React component mapping
  image-slots.ts          # canonical image aspect ratios / widths / sizes / export dimensions
  reading-time.ts         # reading time derived from the MDX body

public/
  images/{portfolio,editorial,case-studies}/<slug>/…
  videos/portfolio/<slug>/…
  logo-light.svg, logo-dark.svg, resume.pdf
```

Two structural decisions worth knowing:

- **`components/` lives at the repo root**, outside `app/`, to keep routes and reusable UI separate.
- **The three editorial subsections are real routes, not filters.** Each targets a distinct audience and deserves its own linkable URL. Since fixed segments coexist with `[slug]` inside `app/editorial/`, the slugs `software`, `career` and `aotearoa` are **reserved** and must never be used for an article — App Router would shadow it.

Contact is deliberately not a route: it lives as a CTA in the nav and a block in the footer, alongside the résumé link.

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
```

`readingTime` is not declared anywhere: it is derived from the MDX body by [lib/reading-time.ts](lib/reading-time.ts) as the file is read, so it can never drift from the text.

Images referenced from front matter live under `public/images/<collection>/<slug>/`. The canonical aspect ratio, responsive width, `sizes` attribute and recommended export dimensions for every image slot are defined once in [lib/image-slots.ts](lib/image-slots.ts) — use it instead of hardcoding values.

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

**Logo:** interlocked EB monogram, single-ink SVG, in dark-ink and cream variants for light and dark backgrounds.

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
