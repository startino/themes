# `palette/`

Single source of truth for every Startino color, in every flavor.

## Files

- `generate.ts` — TypeScript generator. Edit the `FLAVORS` and `ACCENTS` constants here, never the JSON.
- `palette.json` — generated artifact. Committed. Consumed by every port.
- `palette.schema.json` — JSON Schema validating `palette.json`.
- `generate.test.ts` — anchors + determinism + parity tests.

## Roles

### 12 neutrals (per flavor)

Hue-tinted at H=197 (the green tint inherited from the original `#171919`
seed). Chroma is **per-role**, calibrated at build time via CIEDE2000 to
match the perceptual saturation of Catppuccin's official neutrals from the
paired flavor (mercury↔latte, mars↔frappé, jupiter↔macchiato,
neptune↔mocha). We don't copy Catppuccin's OKLCH chromas verbatim —
green at h=197 reads more saturated than purple at h=285 at identical
numeric C, so doing so over-tints. Instead we solve for the C at our hue
that produces the same ΔE2000 from achromatic, role by role. Neptune
`base` lands at `#061c1d`, replacing the near-grey `#171919` of the
original revision.

| Role       | Use                                           |
| ---------- | --------------------------------------------- |
| `crust`    | Deepest layer (title bars, scrollbar troughs) |
| `mantle`   | Layer behind base (sidebars, gutters)         |
| `base`     | Editor / page background                      |
| `surface0` | Hover state, raised card                      |
| `surface1` | Section divider surface                       |
| `surface2` | Popover, raised dialog                        |
| `overlay0` | Border, divider, dim accent                   |
| `overlay1` | Stronger border, comment indicator            |
| `overlay2` | Comment text, disabled state                  |
| `subtext0` | De-emphasised secondary text                  |
| `subtext1` | Slightly de-emphasised text                   |
| `text`     | Primary foreground                            |

### 14 accents (per flavor)

Equal OKLCH lightness band per flavor (0.809 in dark flavors, 0.55 in
Mercury). This is the perceptual-parity rule — any accent can stand in
for any other without breaking visual hierarchy.

> **Slot names are Catppuccin-compatibility identifiers, not value
> contracts.** Some slots in this table have hexes that deliberately
> diverge from their Catppuccin counterparts to surface Startino's brand
> pair more often. See [`docs/style-guide.md` §7](../docs/style-guide.md)
> for the full rule. The "Recommended use" column below describes the
> Catppuccin semantic the slot name is *associated* with — what each slot
> *renders as* is governed by `generate.ts`.

| Role        | Brand alias | Recommended use                        |
| ----------- | ----------- | -------------------------------------- |
| `green`     | `primary`   | Brand mint. Always primary.            |
| `pink`      | `secondary` | Brand pink. Always secondary.          |
| `red`       | —           | Errors, destructive actions            |
| `peach`     | —           | Warnings, caution                      |
| `yellow`    | —           | Types (in syntax), pending state       |
| `teal`      | —           | (free)                                 |
| `sky`       | —           | (free, often "info" in light apps)     |
| `sapphire`  | —           | Operators (syntax)                     |
| `blue`      | —           | Links, info, functions (syntax)        |
| `lavender`  | —           | (free)                                 |
| `mauve`     | —           | Keywords (syntax)                      |
| `maroon`    | —           | (free)                                 |
| `flamingo`  | —           | (free)                                 |
| `rosewater` | —           | Cursor (terminal)                      |

## Flavor knobs

| Flavor    | OKLCH L | Mood                 |
| --------- | ------- | -------------------- |
| Mercury   | 0.96    | sun-bleached light   |
| Mars      | 0.33    | rust-dusty mid-dark  |
| Jupiter   | 0.27    | banded gas-giant     |
| Neptune ★ | 0.211   | far/cold/deep — anchor |

★ Neptune is anchored to OKLCH `L=0.211, h=197` (the lightness/hue of
the original `#171919` seed). Chroma is solved at build time so the
green tint feels as saturated as Catppuccin Mocha's purple tint at the
matching role (CIEDE2000 ΔE-from-achromatic parity, not raw OKLCH C
parity). The rendered hex is `#061c1d`, replacing `#171919` from
earlier revisions. Other flavors mirror Catppuccin's lightness
progression so the "feel" of switching flavors is calibrated to a
system many already know.

## Updating the palette

1. Edit `generate.ts` — change a flavor's `baseL`, an accent's hue, etc.
2. Run `bun palette/generate.ts`. The script reports the `ΔE` from the
   anchor targets so brand fidelity is observable.
3. Run `bun test`. Tests assert the brand anchors and parity invariants.
4. Commit `generate.ts`, `palette.json`, and any test changes together.

## Why OKLCH

Hex/RGB doesn't express *perceived* lightness. Two hexes with similar
RGB values can look very different in weight; two with very different
RGB values can look identically bright. OKLCH separates lightness (L),
chroma (C), and hue (H) into perceptually-uniform axes — picking a
fixed L for all accents guarantees they all *feel* equally vibrant.
