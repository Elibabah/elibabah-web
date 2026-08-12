import { MdxFigcaption } from "./MdxFigcaption"
import { imageSize } from "image-size";
import { imageSlots } from "@/lib/image-slots";
import path from "node:path";
import { readFileSync } from "node:fs";

type MdxVideoProps = {
    src: string;
    variant: keyof typeof imageSlots.video;
    poster: string;
    caption?: string;
    sourceLabel?: string;
    sourceHref?: string;
    label: string;
};

export function MdxVideo({src, variant, poster, caption, sourceLabel, sourceHref, label}: Readonly<MdxVideoProps>){
    if (!label) throw new Error(`MdxVideo: missing label for ${src}`);
    
    const { width, height } = imageSize(readFileSync(path.join(process.cwd(), "public", poster)));
    const { maxWidthClass } = imageSlots.video[variant];
    
    return (
        <figure className="not-prose flex flex-col gap-2 items-center my-8">
          <video
            aria-label={label}
            controls
            preload="none"
            playsInline
            poster={poster}
            src={src}
            width={width}
            height={height}
            className={`h-auto rounded-xl ${maxWidthClass}`}
            />
          <MdxFigcaption caption={caption} sourceLabel={sourceLabel} sourceHref={sourceHref} />
        </figure>
    )
}