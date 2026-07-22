import NextImage from "next/image";
import { imageSize } from "image-size";
import path from "path";
import { readFileSync } from "fs";
import type { ReactNode } from "react";

type MdxImageRowProps = {
  src: string;
  alt: string;
  caption?: string;
  side?: "left" | "right";
  children: ReactNode;
};

export function MdxImageRow({ src, alt, caption, side = "left", children }: MdxImageRowProps) {
  const filePath = path.join(process.cwd(), "public", src);
  const { width, height } = imageSize(readFileSync(filePath));

  return (
    <div
      className={`not-prose flex flex-col gap-6 my-8 sm:items-center sm:gap-10 ${
        side === "right" ? "sm:flex-row-reverse" : "sm:flex-row"
      }`}
    >
      <figure className="flex flex-col gap-2 shrink-0 sm:w-2/5">
        <NextImage
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="w-full max-w-xs h-auto rounded-xl border border-line mx-auto"
        />
        {caption && (
          <figcaption className="font-mono text-xs text-ink-faint text-center">
            {caption}
          </figcaption>
        )}
      </figure>
      <div className="font-body text-base text-ink-soft leading-relaxed sm:w-3/5">
        {children}
      </div>
    </div>
  );
}
