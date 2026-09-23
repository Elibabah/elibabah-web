import { CV_PDF_FILENAME, CV_PDF_PATH } from "./lib/site";

import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(),
  },
  async headers() {
    return [
      {
        source: CV_PDF_PATH,
        headers: [
          {
            key: "Content-Disposition",
            value: `inline; filename="${CV_PDF_FILENAME}"`,
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      { source: "/resume.pdf", destination: "/cv.pdf", permanent: true },
      {
        source: "/Elias_Hernandez_Frontend_Resume.pdf",
        destination: "/cv.pdf",
        permanent: true,
      },
      { source: "/resume", destination: "/cv", permanent: true },
    ];
  },
};

export default nextConfig;
