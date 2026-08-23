import { getAllResearch, getResearchBySlug } from "@/lib/research"

import { ImageResponse } from "next/og"
import { join } from "node:path"
import { readFileSync } from "node:fs"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// One card per work, prerendered like the page itself.
export function generateStaticParams() {
  return getAllResearch().map((work) => ({ slug: work.slug }))
}

// Long titles step down so they never overflow the frame.
function titleSize(title: string): number {
  if (title.length > 62) return 44
  if (title.length > 40) return 52
  return 62
}

export default async function ResearchOGImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const work = getResearchBySlug(slug)

  const fontData = readFileSync(
    join(process.cwd(), "public/fonts/SourceSerif4-Bold.ttf"),
  )

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          backgroundColor: "#121514",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 80px",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#4D9FB3",
            }}
          />
          <span
            style={{
              fontFamily: '"Source Serif 4"',
              fontWeight: 700,
              fontSize: 22,
              color: "#ECEEEA",
              letterSpacing: "-0.3px",
            }}
          >
            elibabah
          </span>
        </div>

        {/* Title block */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <span
            style={{
              fontSize: 14,
              color: "#4D9FB3",
              letterSpacing: "0.6px",
              textTransform: "uppercase",
            }}
          >
            {work.kind}
          </span>
          <span
            style={{
              fontFamily: '"Source Serif 4"',
              fontWeight: 700,
              fontSize: titleSize(work.title),
              color: "#ECEEEA",
              lineHeight: 1.12,
              letterSpacing: "-0.5px",
            }}
          >
            {work.title}
          </span>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #2A2F2E",
            paddingTop: 24,
          }}
        >
          <span style={{ fontSize: 15, color: "#4D9FB3" }}>elibabah.com</span>
          <span style={{ fontSize: 15, color: "#A4ABAC" }}>
            {work.institution} · {work.year}
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Source Serif 4",
          data: fontData,
          weight: 700,
          style: "normal",
        },
      ],
    },
  )
}
