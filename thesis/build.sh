#!/usr/bin/env bash
#
# Rebuilds both published editions of the UNAM thesis from sources in this repo.
#
#   ./thesis/build.sh            both editions
#   ./thesis/build.sh es         Spanish only
#   ./thesis/build.sh en         English only
#   ./thesis/build.sh covers     card thumbnails only
#
# Outputs to public/thesis/ (the PDFs) and public/images/research/ (the cover
# thumbnails used by the /research cards).
#
# The two editions are produced very differently, and that is deliberate:
#
#   Spanish  page surgery on the deposited PDF. The body pages are never
#            re-rendered, so the original typesetting and the printed page
#            numbers survive exactly. Only the front matter changes.
#
#   English  typeset from the Markdown in thesis/en/, which is the source of
#            truth for the translation.
#
# Requires: typst, qpdf, pandoc, poppler (pdftoppm/pdfinfo), imagemagick.
#   brew install typst qpdf pandoc poppler imagemagick

set -euo pipefail

cd "$(dirname "$0")/.."

BUILD=thesis/build
SRC=thesis/source/elias_tesis_unam-ORIGINAL.pdf
OUT_ES=public/thesis/tesis-la-imaginacion-como-salvacion-es.pdf
OUT_EN=public/thesis/thesis-imagination-as-salvation-en.pdf
COVER_DIR=public/images/research/imaginacion-como-salvacion

# Front matter kept from the deposited PDF, by physical page number.
#   1     UNAM title page ........... dropped, replaced by cover-es.typ
#   2     DGB restrictions notice ... dropped, its copyright folded into the cover
#   3     dedication ................ KEPT
#   4-5   acknowledgements .......... dropped
#   6     Parra, "El hombre imaginario" ... dropped (whole poem, still in copyright)
#   7     epigraphs ................. KEPT
#   8     índice .................... KEPT
#   9-194 body ...................... KEPT
ES_PAGES="3,7,8,9-194"

need() {
  command -v "$1" >/dev/null 2>&1 || { echo "missing: $1  (brew install $2)" >&2; exit 1; }
}

build_es() {
  echo "── Spanish edition"
  [ -f "$SRC" ] || { echo "missing source: $SRC" >&2; exit 1; }
  typst compile "$BUILD/cover-es.typ" "$BUILD/cover-es.pdf"
  # --decrypt: the deposited PDF carries print:no/copy:no owner restrictions,
  # which would otherwise stop a reader printing their own copy.
  qpdf --empty --decrypt \
    --pages "$BUILD/cover-es.pdf" 1 "$SRC" "$ES_PAGES" -- \
    "$OUT_ES"
  echo "   $OUT_ES  ($(pdfinfo "$OUT_ES" | awk '/^Pages/{print $2}') pp.)"
}

build_en() {
  echo "── English edition"
  typst compile "$BUILD/frontmatter-en.typ" "$BUILD/frontmatter-en.pdf"

  # Concatenate thesis/en/*.md into one document.
  #
  # Two things have to happen here or the build is silently wrong:
  #
  #  1. Footnote labels are namespaced per file. Chapters restart their
  #     numbering in the original, so several files define [^1]; without a
  #     prefix pandoc would collapse them into one footnote.
  #  2. Some top-level headings are demoted, to reproduce the original
  #     hierarchy: Theoretical framework nests under the Introduction, and
  #     chapters 2-4 nest under the part title that opens chapter 1's file.
  python3 - <<'PY'
import re, glob, os
files  = sorted(glob.glob('thesis/en/*.md'))
demote = {'01-theoretical-framework.md', '03-chapter-2.md',
          '04-chapter-3.md', '05-chapter-4.md'}
parts = []
for i, f in enumerate(files):
    s = open(f, encoding='utf-8').read()
    s = re.sub(r'\[\^(\d+)\]', lambda m: f'[^f{i}-{m.group(1)}]', s)
    if os.path.basename(f) in demote:
        s = re.sub(r'^# ', '## ', s, count=1, flags=re.M)
    parts.append(s.strip())

brk  = '```{=typst}\n#pagebreak()\n```'
body = brk + '\n\n' + f'\n\n{brk}\n\n'.join(parts) + '\n'
open('thesis/build/body-en.md', 'w', encoding='utf-8').write(body)

defs = re.findall(r'^\[\^([^\]]+)\]:', body, re.M)
refs = set(re.findall(r'\[\^([^\]]+)\](?!:)', body))
assert len(defs) == len(set(defs)), 'duplicate footnote labels'
assert not (refs - set(defs)), f'unresolved footnotes: {sorted(refs - set(defs))[:5]}'
print(f"   {len(files)} files, {len(defs)} footnotes, all resolving")
PY

  pandoc "$BUILD/body-en.md" -o "$BUILD/body-en.pdf" \
    --pdf-engine=typst --toc --toc-depth=2 \
    -V papersize=us-letter -V mainfont="Times New Roman" -V fontsize=11pt \
    -V margin-x=90pt -V margin-y=96pt -V linestretch=1.15 \
    --metadata title=""

  qpdf --empty --pages "$BUILD/frontmatter-en.pdf" 1-3 "$BUILD/body-en.pdf" 1-z -- "$OUT_EN"
  echo "   $OUT_EN  ($(pdfinfo "$OUT_EN" | awk '/^Pages/{print $2}') pp.)"
}

# Card thumbnails for /research, rendered from page 1 of each built edition.
build_covers() {
  echo "── cover thumbnails"
  mkdir -p "$COVER_DIR"
  for pair in "$OUT_ES:cover-es" "$OUT_EN:cover-en"; do
    pdf=${pair%%:*}; name=${pair##*:}
    [ -f "$pdf" ] || { echo "   skipped $name (build the edition first)"; continue; }
    tmp=$(mktemp -d)
    pdftoppm -f 1 -l 1 -r 150 -png -singlefile "$pdf" "$tmp/c"
    # 660px wide matches imageSlots.documentCover.exportPx; the hairline border
    # keeps a white page from dissolving into a light background.
    magick "$tmp/c.png" -resize 660x -bordercolor '#e2e3df' -border 1 \
      -quality 88 "$COVER_DIR/$name.jpg"
    rm -rf "$tmp"
    echo "   $COVER_DIR/$name.jpg"
  done
}

need typst typst
need qpdf qpdf
need pandoc pandoc
need pdfinfo poppler
need magick imagemagick

mkdir -p public/thesis

case "${1:-all}" in
  es)     build_es ;;
  en)     build_en ;;
  covers) build_covers ;;
  all)    build_es; build_en; build_covers ;;
  *)      echo "usage: $0 [all|es|en|covers]" >&2; exit 1 ;;
esac

echo "done."
