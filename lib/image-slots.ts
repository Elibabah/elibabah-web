export const imageSlots = {
  cardThumb: {
    // home featured cards & /portfolio listing cards
    aspectClass: "aspect-16/10",
    sizes: "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw", // home 3 columns
    portfolioSizes: "(min-width: 640px) 50vw, 100vw", // portfolio 2 columns
    exportPx: { width: 1600, height: 1000 },
  },
  heroBand: {
    // /portfolio/[slug], /case-studies/[slug], /editorial/[slug]
    aspectClass: "aspect-21/9",
    sizes: "(min-width: 1024px) 976px, calc(100vw - 48px)",
    exportPx: { width: 1960, height: 840 },
  },
  relatedThumb: {
    // mini-card "related project" in /editorial/[slug]
    aspectClass: "aspect-square",
    sizes: "80px",
    exportPx: { width: 240, height: 240 },
  },
  body: {
    screenshotMobile: {
      // portfolio & editorial/software
      maxWidthClass: "max-w-xs",
      sizes: "320px",
      exportPx: { width: 750 },
    },
    screenshotDesktop: {
      // portfolio & editorial/software
      maxWidthClass: "w-full md:w-3/4",
      sizes: "(min-width: 1024px) 732px, (min-width: 768px) calc(75vw - 36px), calc(100vw - 48px)",
      exportPx: { width: 1800 },
    },
    photo: {
      // editorial/career|aotearoa
      maxWidthClass: "w-full",
      sizes: "(min-width: 1024px) 976px, calc(100vw - 48px)",
      exportPx: { width: 1960 },
    }
  },
  video: {
    demo: { 
      maxWidthClass: "w-full md:w-3/4",
    }
  }
} as const;

export type ImageSlot = keyof typeof imageSlots;
