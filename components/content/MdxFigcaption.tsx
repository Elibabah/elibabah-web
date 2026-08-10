export function MdxFigcaption({ caption, sourceLabel, sourceHref }: Readonly<{
  caption?: string; sourceLabel?: string; sourceHref?: string;
}>) {
  if (!caption && !sourceHref) return null;
  return (
    <figcaption className="font-mono text-xs text-ink-faint text-center">
      {caption}
      {sourceHref && (
        <div className="mt-1">
          <a href={sourceHref} target="_blank" rel="noopener noreferrer"
             className="text-accent hover:underline">
            {sourceLabel ?? "Source"}
          </a>
        </div>
      )}
    </figcaption>
  );
}
