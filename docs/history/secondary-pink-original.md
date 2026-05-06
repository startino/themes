# Secondary Pink — Original vs. Lifted

This file preserves the original `#ff4fad` secondary value before the
perceptual-parity lift applied during palette generation.

---

## Side-by-Side

```
ORIGINAL: oklch(0.698 0.227 352)  #ff4fad
LIFTED:   oklch(0.809 0.18  352)  #ff9ec9 (approx — verify against palette.json)
```

The hue (H=352) is identical. Only lightness and chroma differ.

---

## Rationale

### Why the original broke visual-weight parity

The mint primary `#45dfa4` sits at OKLCH L=0.809 — quite bright, placing it
well into the upper quarter of the lightness scale in dark-mode contexts.
The original pink `#ff4fad` sits at L=0.698 — noticeably darker, a full
0.111 lightness units below the primary. OKLCH lightness is perceptually
uniform, so that gap is not a small rounding difference: it is visible to
the naked eye in any component that shows the two accents at the same role
weight (e.g. a two-column feature list with mint icons in one column and
pink icons in the other).

### Why unequal lightness breaks the accent ramp

When two accents at different lightness sit side by side at the same role
weight, the darker one reads as "heavier" — more prominent, more demanding of
attention. This breaks the visual-weight equality that makes Catppuccin's
accent ramp feel cohesive. In Catppuccin's dark flavors all 14 accents are
tuned to the same target lightness so a row of accent swatches reads as a
uniform band rather than a contour map. Adopting Catppuccin's surface names
while keeping a mismatched accent pair would undercut the whole point of the
port infrastructure.

### What the lift sacrifices and preserves

The lifted pink keeps brand hue (H=352) and as much chroma as sRGB allows at
L=0.809, landing around `oklch(0.809 0.18 352)` / `#ff9ec9`. This sacrifices
a bit of the "shock" of the original — `#ff4fad` is undeniably more vivid and
more distinctly "hot pink" — to gain perceptual parity with the green primary.
The original `#ff4fad` is preserved here for **marketing and logo contexts**
where the brighter, more saturated form is desirable and where it will not
appear adjacent to the mint primary at equal weight.

---

## How to Flip Back

If you want to restore the original pink for a specific use case, change the
`ACCENT_L_DARK` override for the `pink` entry alone in `palette/generate.ts`.
Be aware that this breaks the parity invariant: the test in
`palette/generate.test.ts` that asserts all dark-flavor accent lightness values
fall within a tolerance band of the primary will fail. Either update the
tolerance, mark the pink entry as exempt in the test, or accept the failing
test as a known deviation and document it in the port README.

Do not change `ACCENT_L_DARK` globally — that would de-tune every other accent
and would likely push some of them outside sRGB gamut at the new lightness.
