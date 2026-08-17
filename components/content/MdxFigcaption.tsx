export function MdxFigcaption({ caption, credit, sourceLabel, sourceHref }: Readonly<{
  caption?: string; credit?: string; sourceLabel?: string; sourceHref?: string;
}>) {
  if (!caption && !credit && !sourceHref) return null;
  return (
    <figcaption className="font-mono text-xs text-ink-faint text-center space-y-1">
      {caption && (
        <div>
          {caption}
        </div>
      )}
      {credit && (
        <div>
          {credit}
        </div>
      )}
      {sourceHref && (
        <div>
          <a href={sourceHref} target="_blank" rel="noopener noreferrer"
             className="text-accent hover:underline">
            {sourceLabel ?? "Source"}
          </a>
        </div>
      )}
    </figcaption>
  );
}
