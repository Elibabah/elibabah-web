import { MdxFigcaption } from "./MdxFigcaption"
import NextImage from "next/image";
import type { ReactNode } from "react";
import { imageSize } from "image-size";
import { imageSlots } from "@/lib/image-slots";
import path from "node:path";
import { readFileSync } from "node:fs";

type MdxImageRowProps = {
  src: string;
  alt: string;
  caption?: string;
  sourceLabel?: string;
  sourceHref?: string;
  side?: "left" | "right";
  children: ReactNode;
};

export function MdxImageRow({ src, alt, caption, sourceLabel, sourceHref, side = "left", children }: Readonly<MdxImageRowProps>) {
  const filePath = path.join(process.cwd(), "public", src);
  const { width, height } = imageSize(readFileSync(filePath));
  const { maxWidthClass, sizes } = imageSlots.body.screenshotMobile;

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
          sizes={sizes}
          width={width}
          height={height}
          className={`w-full ${maxWidthClass} h-auto mx-auto rounded-xl`}
        />
        <MdxFigcaption caption={caption} sourceLabel={sourceLabel} sourceHref={sourceHref} />
      </figure>
      <div className="font-body text-base text-ink-soft leading-relaxed sm:w-3/5">
        {children}
      </div>
    </div>
  );
}
