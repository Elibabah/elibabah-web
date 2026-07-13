import type { MetadataRoute } from "next"
import { getAllArticles } from "@/lib/editorial"
import { getAllCaseStudies } from "@/lib/case-studies"
import { getAllProjects } from "@/lib/portfolio"

const BASE = "https://elibabah.com"

export default function sitemap(): MetadataRoute.Sitemap {
  const projects = getAllProjects().map((p) => ({
    url: `${BASE}/portfolio/${p.slug}`,
    lastModified: new Date(),
  }))

  const articles = getAllArticles().map((a) => ({
    url: `${BASE}/editorial/${a.slug}`,
    lastModified: new Date(),
  }))

  const caseStudies = getAllCaseStudies().map((cs) => ({
    url: `${BASE}/case-studies/${cs.slug}`,
    lastModified: new Date(),
  }))

  return [
    { url: BASE },
    { url: `${BASE}/portfolio` },
    { url: `${BASE}/editorial` },
    { url: `${BASE}/editorial/software` },
    { url: `${BASE}/editorial/career` },
    { url: `${BASE}/editorial/aotearoa` },
    { url: `${BASE}/about` },
    ...projects,
    ...articles,
    ...caseStudies,
  ]
}
