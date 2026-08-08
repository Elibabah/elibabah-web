import { imageSize } from "image-size";
import { imageSlots } from "@/lib/image-slots";
import path from "node:path";
import { readFileSync } from "node:fs";

type MdxVideoProps = {
    src: string;
    variant: keyof typeof imageSlots.video;
    poster: string;
    caption?: string;
};

export function MdxVideo({src, variant, poster, caption}: Readonly<MdxVideoProps>){
    const { width, height } = imageSize(readFileSync(path.join(process.cwd(), "public", poster)));
    const { maxWidthClass } = imageSlots.video[variant];
    
    return (
        <figure className="not-prose flex flex-col gap-2 items-center my-8">
          <video
            aria-label="Demo walkthrough"
            controls
            preload="none"
            playsInline
            poster={poster}
            src={src}
            width={width}
            height={height}
            className={`h-auto rounded-xl ${maxWidthClass}`}
          />
          {caption && (
            <figcaption className="font-mono text-xs text-ink-faint text-center">
                {caption}
            </figcaption>
          )}
        </figure>
    )
}