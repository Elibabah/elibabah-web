import NextImage from "next/image";
import { imageSize } from "image-size";
import path from "path";
import { readFileSync } from "fs";

type MdxImageProps = {
  src: string;
  alt: string;
  caption?: string;
};

const PHONE_ASPECT_RATIO_THRESHOLD = 0.6;

export function MdxImage({ src, alt, caption }: MdxImageProps) {
  const filePath = path.join(process.cwd(), "public", src);
  const { width, height } = imageSize(readFileSync(filePath));
  const isPhoneShaped = width / height < PHONE_ASPECT_RATIO_THRESHOLD;

  return (
    <figure className={`flex flex-col gap-2 ${isPhoneShaped ? "items-center" : ""}`}>
      <NextImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`h-auto rounded-xl border border-line ${isPhoneShaped ? "w-full max-w-xs" : "w-full"}`}
      />
      {caption && (
        <figcaption className={isPhoneShaped ? "text-center" : undefined}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
