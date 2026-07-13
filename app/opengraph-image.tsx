import { ImageResponse } from "next/og"
import { join } from "path"
import { readFileSync } from "fs"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OGImage() {
  const fontData = readFileSync(join(process.cwd(), "public/fonts/SourceSerif4-Bold.ttf"))

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          backgroundColor: "#121514",
          display: "flex",
          flexDirection: "column",
          padding: "64px 80px",
          justifyContent: "space-between",
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

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <span
            style={{
              fontSize: 14,
              color: "#4D9FB3",
              letterSpacing: "0.6px",
              textTransform: "uppercase",
            }}
          >
            Frontend Engineer · New Zealand
          </span>
          <span
            style={{
              fontFamily: '"Source Serif 4"',
              fontWeight: 700,
              fontSize: 68,
              color: "#ECEEEA",
              lineHeight: 1.1,
              letterSpacing: "-0.5px",
            }}
          >
            Elías Hernández
          </span>
          <span
            style={{
              fontSize: 24,
              color: "#A4ABAC",
              lineHeight: 1.5,
              marginTop: 4,
            }}
          >
            Building software. Writing about craft and life in Aotearoa.
          </span>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            borderTop: "1px solid #2A2F2E",
            paddingTop: 24,
          }}
        >
          <span style={{ fontSize: 15, color: "#4D9FB3" }}>
            elibabah.com
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
    }
  )
}
