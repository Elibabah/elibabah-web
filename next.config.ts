import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(),
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
