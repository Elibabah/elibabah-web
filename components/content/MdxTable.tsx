import type { ComponentPropsWithoutRef } from "react";

/**
 * A GFM table, wrapped in its own scroll panel.
 *
 * The same reasoning as MdxMermaid: the article column is narrower than the
 * content on a phone, and a wide table must scroll inside itself rather than
 * push the whole page into a horizontal scroll. Unlike a diagram, a table is
 * never scaled down — shrinking type is not an option for something the reader
 * has to read cell by cell, so the panel simply pans.
 *
 * `tabIndex={0}` because a region that scrolls and cannot be reached by
 * keyboard is a WCAG 2.1.1 failure, and `overscroll-x-contain` so panning to
 * the end does not trigger the browser's back gesture.
 */
export function MdxTable(props: Readonly<ComponentPropsWithoutRef<"table">>) {
  return (
    <div
      tabIndex={0}
      className="my-6 overflow-x-auto overscroll-x-contain rounded-lg border border-line"
    >
      {/*
        The wrapper owns the vertical rhythm, so the table's own margin has to go
        or it becomes 29px of dead space inside the border. It needs `!` because
        @tailwindcss/typography styles the table at `.prose :where(table)`, which
        outranks a plain utility class. This is overriding a plugin default, not
        breaking a tie of our own making.
      */}
      <table {...props} className="my-0! min-w-[36rem]" />
    </div>
  );
}
