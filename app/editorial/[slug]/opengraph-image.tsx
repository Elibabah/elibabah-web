import { getAllArticles, getArticleBySlug } from "@/lib/editorial"

import { ImageResponse } from "next/og"
import { join } from "node:path"
import { readFileSync } from "node:fs"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Prerender one card per article; the route itself is static, like the page.
export function generateStaticParams() {
  return getAllArticles().map((article) => ({ slug: article.slug }))
}

// 1200x630 frame 
function heroDataUri(heroBand: string | null): string | null {
  if (!heroBand) return null
  const mime = heroBand.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg"
  const bytes = readFileSync(join(process.cwd(), "public", heroBand))
  return `data:${mime};base64,${bytes.toString("base64")}`
}

// Long titles need to come down a step or two so they never overflow the frame.
function titleSize(title: string): number {
  if (title.length > 48) return 50
  if (title.length > 28) return 60
  return 70
}

export default async function ArticleOGImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = getArticleBySlug(slug)

  const fontData = readFileSync(
    join(process.cwd(), "public/fonts/SourceSerif4-Bold.ttf"),
  )
  const hero = heroDataUri(article.heroBand)

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          position: "relative",
          display: "flex",
          backgroundColor: "#121514",
        }}
      >
        {hero && (
          <img
            alt="article"
            src={hero}
            width={1200}
            height={630}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 1200,
              height: 630,
              objectFit: "cover",
            }}
          />
        )}

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            display: "flex",
            backgroundImage: hero
              ? "linear-gradient(to top, rgba(18,21,20,0.92) 10%, rgba(18,21,20,0.52) 42%, rgba(18,21,20,0.20) 78%, rgba(18,21,20,0.14) 100%)"
              : "linear-gradient(to top, rgba(18,21,20,1) 0%, rgba(18,21,20,1) 100%)",
          }}
        />
        {hero && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 1200,
              height: 630,
              display: "flex",
              backgroundImage:
                "linear-gradient(to right, rgba(18,21,20,0.82) 0%, rgba(18,21,20,0.58) 30%, rgba(18,21,20,0.12) 58%, rgba(18,21,20,0) 72%)",
            }}
          />
        )}

        <div
          style={{
            position: "relative",
            width: 1200,
            height: 630,
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
              {article.section}
            </span>
            <span
              style={{
                fontFamily: '"Source Serif 4"',
                fontWeight: 700,
                fontSize: titleSize(article.title),
                color: "#ECEEEA",
                lineHeight: 1.1,
                letterSpacing: "-0.5px",
              }}
            >
              {article.title}
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
              {article.readingTime} min read
            </span>
          </div>
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
