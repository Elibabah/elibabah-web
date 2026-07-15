import "./globals.css";

import { Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";

import { Analytics } from "@vercel/analytics/next"
import { Footer } from "@/components/layout/Footer";
import type { Metadata } from "next";
import { Nav } from "@/components/layout/Nav";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { ThemeProvider } from "@/components/theme-provider";

const sourceSerif = Source_Serif_4({
  variable: "--font-heading",
  subsets: ["latin"]
})

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"]
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"]
})

export const metadata: Metadata = {
  title: {
    default: "Elibabah — Elías Hernández",
    template: "%s | Elibabah",
  },
  description: "Software developer. Portfolio and editorial.",
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "David Elías Hernández Morales",
  alternateName: ["Elías Hernández", "Elibabah"],
  url: "https://elibabah.com",
  jobTitle: "Frontend Engineer",
  address: {
    "@type": "PostalAddress",
    addressCountry: "NZ",
  },
  sameAs: [
    "https://www.linkedin.com/in/elibabah/",
    "https://github.com/elibabah",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sourceSerif.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />

        <ThemeProvider>
          <Nav />
          {children}
          <Footer />
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
