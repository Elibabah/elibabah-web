// lib/image-slots.ts
export const imageSlots = {
  cardThumb: {
    // home featured cards + /portfolio listing cards
    aspectClass: "aspect-16/10",
    sizes: "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw", // home 3 columns
    portfolioSizes: "(min-width: 640px) 50vw, 100vw", // portfolio 2 columns
    exportPx: { width: 1600, height: 1000 }, // fuente recomendada al exportar
  },
  heroBand: {
    // banda ancha al tope de /portfolio/[slug], /case-studies/[slug], /editorial/[slug]
    aspectClass: "aspect-21/9",
    sizes: "100vw",
    exportPx: { width: 2520, height: 1080 },
  },
  relatedThumb: {
    // mini-card "related project" en /editorial/[slug]
    aspectClass: "aspect-square",
    sizes: "80px",
    exportPx: { width: 240, height: 240 }, // 3x de 80px para retina
  },
} as const;

export type ImageSlot = keyof typeof imageSlots;
