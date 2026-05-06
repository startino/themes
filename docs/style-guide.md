# Startino Themes — Style Guide

> Modeled on the [Catppuccin Style Guide](https://github.com/catppuccin/catppuccin/blob/main/docs/style-guide.md),
> adapted for Startino's two-accent brand.

---

## 1. Brand Inviolables

Startino has two fixed accent colors. They do not rotate, are not user-selectable
by default, and are never substituted with each other or with any other palette
accent.

| Role        | Name    | Hex       | OKLCH (approx)        |
|-------------|---------|-----------|----------------------|
| `primary`   | green   | `#45dfa4` | `oklch(0.809 0.143 160)` |
| `secondary` | pink    | lifted    | `oklch(0.809 0.18 352)`  |

**primary** is the mint-green accent. It appears on CTAs, progress indicators,
active states, and the brand wordmark.

**secondary** is the pink counter-accent. It appears on secondary actions,
highlights, and brand decorative elements.

Neither may be replaced by the other. Neither may be substituted with `mauve`,
`sky`, `blue`, or any other palette accent in UI elements that carry the
`primary` or `secondary` semantic.

Catppuccin's "user picks an accent" feature is **intentionally not adopted**.
We do not rotate accents. See §5 for the no-rotation rule and §6 for the
override clause.

---

## 2. Surfaces

Twelve neutrals form the perceptual stack, ordered from deepest (darkest in dark
mode, lightest in light mode) to highest.

| Token      | Role                                                              |
|------------|-------------------------------------------------------------------|
| `crust`    | Deepest layer: title bars, scrollbar troughs, window chrome       |
| `mantle`   | Layer behind base: sidebars, gutters, outer frames                |
| `base`     | Canvas: editor background, page background                        |
| `surface0` | First raised tier: hover states, subtle separators               |
| `surface1` | Second raised tier: raised cards, input backgrounds              |
| `surface2` | Third raised tier: popovers, tooltips, floating panels           |
| `overlay0` | Borders and hard dividers                                         |
| `overlay1` | Slightly lighter borders, secondary dividers                     |
| `overlay2` | Dim accent use: muted icons, inactive tab indicators             |
| `subtext0` | De-emphasized text: disabled labels, secondary metadata          |
| `subtext1` | Slightly stronger de-emphasis: comments, placeholder text        |
| `text`     | Primary foreground: all body copy, headings, active labels       |

**Visual stacking rule:** `crust` is always the lowest layer. `text` is always
the highest foreground. Do not invert this order for any component.

---

## 3. Status Semantics

Map palette accents to UI semantic roles as follows:

| Accent   | Semantic                        | Notes                                      |
|----------|---------------------------------|--------------------------------------------|
| `red`    | Error / destructive action      | Delete buttons, validation errors          |
| `peach`  | Warning / caution               | Alert banners, rate-limit notices          |
| `green`  | Success                         | Confirmation states, success toasts        |
| `blue`   | Info / link                     | Informational banners, hyperlinks          |
| `yellow` | Pending state / types (syntax)  | Spinner labels, type annotations           |

**`pink` (secondary) must never be used for status.**
It is reserved exclusively for brand counter-accent use. Introducing pink as
a status color would collide with the secondary brand role and erode the
visual grammar.

`green` intentionally overlaps with `primary` — they share the same hue.
A success indicator reading as "primary brand" is acceptable and expected.

---

## 4. Syntax Highlighting

When porting an editor theme (VSCode, Helix, Neovim, etc.), map token types
to palette accents as follows. These are verbatim Catppuccin conventions and
are maintained for cross-port consistency.

| Token type  | Accent     |
|-------------|------------|
| Keywords    | `mauve`    |
| Strings     | `green`    |
| Comments    | `overlay2` |
| Numbers     | `peach`    |
| Functions   | `blue`     |
| Types       | `yellow`   |
| Operators   | `sky`      |
| Constants   | `peach`    |

Deviation from this table should be justified in the port's README and must not
conflict with the status semantics in §3.

---

## 5. No Accent Rotation

Startino apps ship with a fixed `primary=green`, `secondary=pink` pair. This is
the default and should be what every fresh install presents.

If a port targets an application that supports user-configurable accent colors
(e.g. a terminal emulator or a chat client with a theme picker), the port author
may expose that configuration. However:

- The **default** configuration shipped in the port must always set
  `primary=green` and `secondary=pink`.
- Documentation must make clear that deviating from the default breaks
  Startino brand alignment.

This rule exists to ensure that any Startino-themed surface is immediately
recognizable. Accent rotation, even to other palette colors, undermines the
coherence the fixed pair provides.

---

## 6. Override Clause

> **Legibility always wins. Use your judgement when these rules would compromise
> readability.**

No mechanical rule anticipates every contrast ratio, background texture, or
rendering environment. If following any rule in this guide would make text
unreadable, an interactive target too small to perceive, or a status indicator
invisible against its background — break the rule, document the deviation in
the port README, and open an issue so the guide can be updated.

---

## Rationale

Catppuccin's role names (`crust`, `mantle`, `base`, `surface*`, `overlay*`,
`subtext*`, `text`) are adopted verbatim because template portability depends
on a shared vocabulary. Every Catppuccin port template that uses these names
can be mechanically translated to a Startino port with a flavor-name
substitution pass and no structural rewrite. The `alias: primary / secondary`
layer is added on top — not instead — of these names, giving Startino's two
fixed brand accents a stable semantic handle that travels with every port
without forcing port authors to remember which palette accent maps to the
brand at any given time. Template code says `{{ primary }}` and gets the right
green regardless of which flavor is being compiled.
