import { MdxImage } from "@/components/content/MdxImage";
import { MdxImageRow } from "@/components/content/MdxImageRow";
import { MdxPre } from "@/components/content/MdxPre";
import { MdxTable } from "@/components/content/MdxTable";
import { MdxVideo } from "@/components/content/MdxVideo";
import remarkGfm from "remark-gfm";

export const mdxComponents = {
  Image:    MdxImage,
  ImageRow: MdxImageRow,
  Video:    MdxVideo,
  // ```mermaid fences, intercepted at the <pre> level. See MdxPre.
  pre:      MdxPre,
  // GFM tables, wrapped so a wide one scrolls itself. See MdxTable.
  table:    MdxTable
};

/**
 * Compiler options shared by every collection.
 *
 * MDX on its own is CommonMark, which has no tables. Without remark-gfm a
 * `| a | b |` table is not a table at all: it parses as a paragraph and renders
 * as a wall of literal pipes, with no error at build time and nothing in the
 * console. Strikethrough, task lists, footnotes and bare autolinks fail the
 * same silent way.
 *
 * This lives here, next to the component map, so the two halves of "how MDX is
 * rendered on this site" stay together and a new collection cannot pick up one
 * without the other.
 */
export const mdxOptions = {
  mdxOptions: { remarkPlugins: [remarkGfm] }
};
