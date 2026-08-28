import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { MdxMermaid } from "./MdxMermaid";
import { isValidElement } from "react";

type CodeProps = { className?: string; children?: ReactNode };

/**
 * A ```mermaid fence reaches MDX as <pre><code class="language-mermaid">.
 * Intercepting <pre> is what lets a diagram be authored exactly as it is in a
 * repo README — same source, copied across without editing.
 */
export function MdxPre(props: Readonly<ComponentPropsWithoutRef<"pre">>) {
  const child = props.children;

  if (isValidElement<CodeProps>(child) && child.props.className?.includes("language-mermaid")) {
    return <MdxMermaid chart={String(child.props.children ?? "").trimEnd()} />;
  }

  return <pre {...props} />;
}
