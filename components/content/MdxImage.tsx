import NextImage from "next/image";
import { imageSize } from "image-size";
import path from "path";
import { readFileSync } from "fs";

type MdxImageProps = {
  src: string;
  alt: string;
  caption?: string;
};

export function MdxImage({ src, alt, caption }: MdxImageProps) {
  const filePath = path.join(process.cwd(), "public", src);
  const { width, height } = imageSize(readFileSync(filePath));

  return (
    <figure className="flex flex-col gap-2">
      <NextImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="w-full h-auto rounded-xl border border-line"
      />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
