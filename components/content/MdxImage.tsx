import NextImage from "next/image";
import { imageSize } from "image-size";
import { imageSlots } from "@/lib/image-slots";
import path from "path";
import { readFileSync } from "fs";

type MdxImageProps = {
  src: string;
  alt: string;
  variant: keyof typeof imageSlots.body;
  caption?: string;
};

export function MdxImage({ src, alt, variant, caption }: MdxImageProps) {
  const filePath = path.join(process.cwd(), "public", src);
  const { width, height } = imageSize(readFileSync(filePath));
  const { maxWidthClass } = imageSlots.body[variant];

  return (
    <figure className="flex flex-col gap-2 items-center">
      <NextImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`h-auto rounded-xl border border-line ${maxWidthClass}`}
      />
      {caption && (
        <figcaption className="text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
