import { MdxFigcaption } from "./MdxFigcaption"
import NextImage from "next/image";
import { imageSize } from "image-size";
import { imageSlots } from "@/lib/image-slots";
import path from "node:path";
import { readFileSync } from "node:fs";

type MdxImageProps = {
  src: string;
  alt: string;
  variant: keyof typeof imageSlots.body;
  caption?: string;
  sourceLabel?: string;
  sourceHref?: string;
};

export function MdxImage({ src, alt, variant, caption, sourceLabel, sourceHref }: Readonly<MdxImageProps>) {
  const filePath = path.join(process.cwd(), "public", src);
  const { width, height } = imageSize(readFileSync(filePath));
  const { maxWidthClass, sizes } = imageSlots.body[variant];

  return (
    <figure className="not-prose flex flex-col gap-2 items-center my-8">
      <NextImage
        src={src}
        alt={alt}
        sizes={sizes}
        width={width}
        height={height}
        className={`h-auto rounded-xl ${maxWidthClass}`}
      />
      <MdxFigcaption caption={caption} sourceLabel={sourceLabel} sourceHref={sourceHref} />
    </figure>
  );
}
