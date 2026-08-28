"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { useTheme } from "next-themes";

/**
 * Mermaid, rendered in the browser and nowhere else.
 *
 * Mermaid measures text with getBBox, so it needs a real DOM: there is no
 * browserless renderer, and the build-time route (rehype-mermaid) drags
 * Playwright into every Vercel deploy. So the library is imported lazily, from
 * inside the effect, which puts it in its own chunk that only downloads on the
 * pages that actually contain a diagram — below the fold, after paint.
 *
 * Theming is the reason this reads the tokens instead of picking a Mermaid
 * preset. Mermaid derives colours (borders, contrast text) with khroma, which
 * needs real values, so `var(--surface)` cannot be handed to it directly. The
 * variables are resolved against the live document and re-resolved whenever the
 * theme changes, which is also what forces the re-render.
 *
 * Sizing is the third thing this owns. Letting the SVG shrink to the container
 * (max-width: 100%) is what makes a wide flowchart illegible on a phone: a
 * 900px diagram in a 360px column renders its 16px type at about 6px, and the
 * scroll container never engages because nothing overflows. So the width is set
 * explicitly instead — fit-to-container, but floored at a scale where the text
 * is still readable — and anything past that is reached by scrolling, zooming,
 * or opening the diagram full screen.
 */

/** Below this the 16px Mermaid type drops under ~11px, which is not worth showing. */
const MIN_FIT_SCALE = 0.7;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.25;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

type MdxMermaidProps = {
  chart: string;
};

function readTokens(style: CSSStyleDeclaration) {
  const token = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;

  return {
    background: token("--surface", "#ffffff"),
    surface:    token("--background", "#f6f7f6"),
    foreground: token("--foreground", "#15160f"),
    inkSoft:    token("--ink-soft", "#4a5258"),
    inkFaint:   token("--ink-faint", "#6a7174"),
    line:       token("--line", "#dee3e2"),
    accent:     token("--color-accent", "#0c5566"),
    accentSoft: token("--accent-soft", "#e0ecee"),
    body:       token("--font-body", "sans-serif"),
    mono:       token("--font-mono", "monospace"),
  };
}

/**
 * Mermaid's classDef parser rejects var(), so the source never gets to see one:
 * every var(--token) in the diagram is resolved against the live document first.
 * An unknown name is left untouched rather than blanked, so a typo fails loudly.
 */
function resolveVars(source: string, style: CSSStyleDeclaration) {
  return source.replace(/var\(\s*(--[\w-]+)\s*\)/g, (whole, name: string) =>
    style.getPropertyValue(name).trim() || whole,
  );
}

const controlClass =
  "rounded-md border border-line px-2.5 py-1 font-mono text-xs text-ink-soft " +
  "transition-colors hover:border-accent hover:text-accent " +
  "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line " +
  "disabled:hover:text-ink-soft";

/**
 * One rendering of a diagram, owning its own fit and zoom.
 *
 * There are two of these on screen at most — the one in the article and the one
 * in the full-screen dialog — and they must size independently, because the
 * space they are given is completely different. Everything here is derived from
 * the surface's own measured width, so neither knows the other exists.
 */
function DiagramSurface({ svg, fill = false, children }: Readonly<{
  svg: string;
  /** In the dialog the surface takes the room it is given, and scrolls both ways. */
  fill?: boolean;
  /** Trailing controls: expand in the article, close in the dialog. */
  children?: React.ReactNode;
}>) {
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [host, setHost] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);

  const hostRef = useRef<HTMLDivElement>(null);
  // A manual zoom must survive a resize, or rotating the phone would undo it.
  const userZoomed = useRef(false);

  // Track the surface so "does this even fit" stays true through a rotation.
  // Height matters only full screen, where fitting the whole diagram is the
  // entire point and a width-only fit would just scroll vertically instead.
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    // clientWidth includes the panel's own padding, and the diagram only has
    // the content box to sit in — measuring the wrong one overflows by 2×p-7.
    const measure = () => {
      const { paddingLeft, paddingRight, paddingTop, paddingBottom } = getComputedStyle(el);
      setHost({
        width:  el.clientWidth  - parseFloat(paddingLeft) - parseFloat(paddingRight),
        height: el.clientHeight - parseFloat(paddingTop)  - parseFloat(paddingBottom),
      });
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => { userZoomed.current = false; }, [svg]);

  const fitZoom = useCallback(() => {
    if (!natural.width) return 1;

    // In the article, legibility wins: fit the column, but never shrink past the
    // point where the type stops being readable — the panel scrolls instead.
    if (!fill) return clamp(Math.min(1, host.width / natural.width), MIN_FIT_SCALE, 1);

    // Full screen, seeing the whole thing wins, so the height counts too — fitting
    // width alone would just trade horizontal scrolling for vertical. The floor is
    // the same as the article's: below it the type is unreadable, and on a phone a
    // wide diagram overflows at any scale that small anyway, so going lower costs
    // legibility and buys no overview at all.
    const byWidth = host.width / natural.width;
    const byHeight = natural.height ? host.height / natural.height : Infinity;
    return clamp(Math.min(1, byWidth, byHeight), MIN_FIT_SCALE, 1);
  }, [fill, host.width, host.height, natural.width, natural.height]);

  // Fit to the surface, but never below the point where the type stops being
  // readable — past that the diagram overflows and the panel scrolls.
  useEffect(() => {
    if (!natural.width || !host.width || userZoomed.current) return;
    setZoom(fitZoom());
  }, [natural.width, host.width, fitZoom]);

  // Deliberately dependency-free: this has to run after *every* commit.
  //
  // React owns this subtree through dangerouslySetInnerHTML, so any commit that
  // recreates the panel — the controls row appearing above it was the one that
  // caught us — rebuilds the <svg> from the HTML string and silently discards
  // the width set on the previous node, without changing anything this effect
  // could have depended on. The symptom was a diagram intermittently stuck at
  // its 300px intrinsic default. Re-applying every time is a couple of style
  // writes on a cached element, and it cannot go stale.
  //
  // Measuring lives here too: natural size is read off the viewBox, which the
  // width below never disturbs, so the pass is idempotent.
  useEffect(() => {
    const el = hostRef.current?.querySelector("svg");
    if (!el) return;

    const box = el.viewBox?.baseVal;
    const width = box?.width || el.getBoundingClientRect().width;
    const height = box?.height ?? 0;
    if (!width) return;
    if (width !== natural.width || height !== natural.height) setNatural({ width, height });

    el.style.maxWidth = "none";
    el.style.width = `${width * zoom}px`;
    el.style.height = "auto";
  });

  const changeZoom = (delta: number) => {
    userZoomed.current = true;
    setZoom((current) => clamp(Math.round((current + delta) * 100) / 100, MIN_ZOOM, MAX_ZOOM));
  };

  const resetZoom = () => {
    userZoomed.current = false;
    if (natural.width && host.width) setZoom(fitZoom());
  };

  // Only true while the diagram is actually wider than its panel — the scroll
  // hint depends on it, the controls no longer do.
  const overflows = natural.width > 0 && host.width > 0 && natural.width > host.width;

  return (
    <div className={`flex flex-col gap-2 ${fill ? "min-h-0 flex-1" : ""}`}>
      {/* Always present, always visible. Tying this to "does it overflow" made the
          controls come and go on the same diagram as a phone was rotated, and hid
          Expand on exactly the diagrams a reader might still want full screen.
          Its being unconditional is also what keeps the sibling list stable — a
          child appearing above the panel makes React rebuild the panel under it. */}
      <div
        className={`flex items-center justify-end gap-1 ${
          fill ? "shrink-0 border-b border-line bg-background px-4 py-3" : ""
        }`}
      >
        <span className="mr-auto font-mono text-[10px] uppercase tracking-[0.6px] text-ink-faint">
          {overflows ? "Scroll to pan" : "\u00A0"}
        </span>

        <button type="button" onClick={() => changeZoom(-ZOOM_STEP)} disabled={zoom <= MIN_ZOOM}
                aria-label="Zoom out" className={controlClass}>
          &minus;
        </button>

        <button type="button" onClick={resetZoom} aria-label="Fit diagram to the available width"
                className={`${controlClass} tabular-nums`}>
          {Math.round(zoom * 100)}%
        </button>

        <button type="button" onClick={() => changeZoom(ZOOM_STEP)} disabled={zoom >= MAX_ZOOM}
                aria-label="Zoom in" className={controlClass}>
          +
        </button>

        {children}
      </div>

      <div
        ref={hostRef}
        // Focusable because it scrolls: a keyboard user has no other way to pan it.
        tabIndex={0}
        role="region"
        aria-label="Diagram"
        className={`overscroll-contain focus-visible:outline-2 focus-visible:outline-offset-2
                    focus-visible:outline-accent ${
                      fill
                        // No card inside the dialog: the screen is the frame.
                        ? "min-h-0 flex-1 overflow-auto bg-background p-4"
                        : "overflow-x-auto rounded-xl border border-line bg-surface p-5 sm:p-7"
                    }`}
      >
        <div
          // w-max so the SVG's own width defines the scrollable extent; mx-auto
          // so it still sits centred while it is narrower than the surface.
          className={`mx-auto w-max ${fill ? "flex min-h-full items-center" : ""}`}
          // Mermaid sanitises its own output at securityLevel "strict".
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>
  );
}

export function MdxMermaid({ chart }: Readonly<MdxMermaidProps>) {
  const { resolvedTheme } = useTheme();
  const reactId = useId();
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const domId = `mermaid-${reactId.replace(/[^a-zA-Z0-9]/g, "")}`;

  useEffect(() => {
    let cancelled = false;

    async function draw() {
      try {
        const mermaid = (await import("mermaid")).default;
        const style = getComputedStyle(document.documentElement);
        const t = readTokens(style);

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "base",
          fontFamily: t.body,
          themeVariables: {
            background:        t.background,
            primaryColor:      t.accentSoft,
            primaryTextColor:  t.foreground,
            primaryBorderColor: t.accent,
            secondaryColor:    t.surface,
            secondaryTextColor: t.foreground,
            secondaryBorderColor: t.line,
            tertiaryColor:     t.background,
            tertiaryTextColor: t.inkSoft,
            tertiaryBorderColor: t.line,
            mainBkg:           t.surface,
            nodeBorder:        t.line,
            nodeTextColor:     t.foreground,
            lineColor:         t.inkFaint,
            textColor:         t.foreground,
            titleColor:        t.foreground,
            clusterBkg:        t.background,
            clusterBorder:     t.line,
            edgeLabelBackground: t.background,
            // Sequence diagrams
            actorBkg:          t.accentSoft,
            actorBorder:       t.accent,
            actorTextColor:    t.foreground,
            actorLineColor:    t.line,
            signalColor:       t.foreground,
            signalTextColor:   t.foreground,
            labelBoxBkgColor:  t.surface,
            labelBoxBorderColor: t.line,
            labelTextColor:    t.foreground,
            loopTextColor:     t.inkSoft,
            noteBkgColor:      t.background,
            noteBorderColor:   t.line,
            noteTextColor:     t.inkSoft,
            activationBkgColor: t.accentSoft,
            activationBorderColor: t.accent,
            sequenceNumberColor: t.background,
            // State diagrams
            labelColor:        t.foreground,
            altBackground:     t.background,
            transitionColor:   t.inkFaint,
            transitionLabelColor: t.inkSoft,
            stateBkg:          t.surface,
            stateLabelColor:   t.foreground,
            compositeBackground: t.background,
            compositeBorder:   t.line,
            compositeTitleBackground: t.background,
            innerEndBackground: t.foreground,
            specialStateColor: t.foreground,
          },
        });

        // No container is passed: Mermaid appends a scratch node to it for text
        // measurement, and that node lands inside DOM React is reconciling.
        const { svg: rendered } = await mermaid.render(domId, resolveVars(chart, style));

        if (!cancelled) {
          setSvg(rendered);
          setFailed(false);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    draw();
    return () => { cancelled = true; };
  }, [chart, domId, resolvedTheme]);

  // showModal() rather than an `open` attribute: it is what buys the focus trap,
  // the inert background, Esc-to-close and ::backdrop without writing any of them.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (expanded && !dialog.open) dialog.showModal();
    if (!expanded && dialog.open) dialog.close();
  }, [expanded]);

  // The page behind a modal still scrolls in Chrome, which is disorienting when
  // the thing you are panning is itself scrollable.
  useEffect(() => {
    if (!expanded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [expanded]);

  return (
    <figure className="not-prose my-10 flex flex-col gap-2">
      {svg && !failed && (
        <DiagramSurface svg={svg}>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Open the diagram full screen"
            className={controlClass}
          >
            Expand
          </button>
        </DiagramSurface>
      )}

      {!svg && !failed && (
        <div className="flex min-h-40 items-center justify-center rounded-xl border border-line bg-surface">
          <span className="font-mono text-xs text-ink-faint">Drawing diagram…</span>
        </div>
      )}

      {failed && (
        <pre className="overflow-x-auto rounded-xl border border-line bg-surface p-5 font-mono text-xs leading-relaxed text-ink-soft sm:p-7">
          {chart}
        </pre>
      )}

      <dialog
        ref={dialogRef}
        onClose={() => setExpanded(false)}
        aria-label="Diagram, full screen"
        // The whole viewport, not a floating panel: covering the page outright is
        // what removes the backdrop as something to look at, and it is the only
        // way a wide diagram gets room worth having on a phone.
        // [&[open]]:flex, not flex: a bare `display:flex` would beat the UA's
        // `dialog:not([open]) { display: none }` and leave the dialog on screen.
        className="m-0 h-[100dvh] max-h-none w-screen max-w-none flex-col bg-background p-0
                   text-foreground backdrop:bg-background [&[open]]:flex"
      >
        {expanded && svg && (
          // Re-ids the copy: Mermaid scopes the diagram's own CSS and its marker
          // url() references by element id, and two live copies would collide.
          <DiagramSurface svg={svg.replaceAll(domId, `${domId}-full`)} fill>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="Close the full-screen diagram"
              className={controlClass}
            >
              Close
            </button>
          </DiagramSurface>
        )}
      </dialog>
    </figure>
  );
}
