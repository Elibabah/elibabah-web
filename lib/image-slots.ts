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
    // las tres rutas la montan dentro de `max-w-5xl px-6`: 1024px - 48px = 976px reales,
    // nunca 100vw. Si cambias ese contenedor, recalcula sizes y exportPx.
    aspectClass: "aspect-21/9",
    sizes: "(min-width: 1024px) 976px, calc(100vw - 48px)",
    exportPx: { width: 1960, height: 840 }, // 2x de 976px, manteniendo 21:9
  },
  relatedThumb: {
    // mini-card "related project" en /editorial/[slug]
    aspectClass: "aspect-square",
    sizes: "80px",
    exportPx: { width: 240, height: 240 }, // 3x de 80px para retina
  },
  body: {
    screenshotMobile: {
      // capturas de apps/sitios en mobile — portfolio y editorial/software
      maxWidthClass: "max-w-xs", // ~320px, ancho de referencia de un celular
      sizes: "320px",
      exportPx: { width: 750 },   // 2x de un viewport mobile típico (375px)
    },
    screenshotDesktop: {
      // capturas de sitios/apps en web — portfolio y editorial/software
      maxWidthClass: "w-full md:w-3/4",
      sizes: "(min-width: 1024px) 732px, (min-width: 768px) calc(75vw - 36px), calc(100vw - 48px)",
      exportPx: { width: 1800 },
    }
  },
  video: {
    demo: { 
      maxWidthClass: "w-full md:w-3/4",
    }
  }
} as const;

export type ImageSlot = keyof typeof imageSlots;
