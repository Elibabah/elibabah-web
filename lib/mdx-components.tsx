import { MdxImage } from "@/components/content/MdxImage";
import { MdxImageRow } from "@/components/content/MdxImageRow";
import { MdxPre } from "@/components/content/MdxPre";
import { MdxVideo } from "@/components/content/MdxVideo";

export const mdxComponents = {
  Image:    MdxImage,
  ImageRow: MdxImageRow,
  Video:    MdxVideo,
  // ```mermaid fences, intercepted at the <pre> level. See MdxPre.
  pre:      MdxPre
};
