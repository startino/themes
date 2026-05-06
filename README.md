# Startino Themes

A Catppuccin-style theme system for Startino. One palette, four planet
flavors, themes for every tool we use.

## What this is

A single source of truth for every Startino color, compiled into
ready-to-drop theme files for terminals, shells, status bars, web
stacks — anything that exposes a theme. Pick a flavor, find the file
for your tool, point your tool's config at it.

Colors are derived in [OKLCH](https://oklch.com), a perceptually
uniform color space, so the brand mint sits at the same visual weight
as the secondary pink, and warm and cool accents read as equally
vivid against any of the four backgrounds. Same discipline that
makes Catppuccin pleasant across hundreds of tools.

## How it works

```
palette/generate.ts ─►  palette/palette.json ─►  compiler/prism.ts ─►  ports/*/dist/
   (design knobs)        (canonical artifact)        (compiler)         (theme files)
```

Three layers:

**`palette/`** — `palette.json` is the canonical artifact, generated
deterministically from `generate.ts` (a TypeScript file of ~80 lines
of OKLCH knobs: hue, chroma, per-flavor-per-accent lightness).
Editing `generate.ts` and re-running is the *only* way the JSON ever
changes; never hand-edit it. Each (flavor × color) entry carries
`hex`, `rgb`, `hsl`, and `oklch` representations, plus an `accent`
flag and a brand `alias` field on the pair that matters
(`green` ↔ `primary`, `pink` ↔ `secondary`).

**`compiler/`** — `prism.ts` is a Bun + [Nunjucks](https://mozilla.github.io/nunjucks/)
compiler, Catppuccin's [Whiskers](https://whiskers.catppuccin.com/)
in spirit. It reads a port's `*.njk` template, parses YAML
frontmatter (`filename`, `matrix`, `skip`), expands the matrix
(typically across the four flavors), and renders one output file per
combination. Tera and Nunjucks are both Jinja2-compatible, so a
Catppuccin port template adapts here with a near-mechanical
`s/catppuccin/startino/` plus a flavor-name remap.

**`ports/`** — one directory per tool. Each owns a `<tool>.njk`
template, a `dist/` of generated theme files (committed to the repo),
and a `README.md`. **End users never run the compiler.** Only
maintainers do, when the palette or a template changes.

## Flavors

| Flavor      | Mood                          | Base       |
| ----------- | ----------------------------- | ---------- |
| Mercury ☿   | sun-bleached light            | `#eef3f3`  |
| Mars ♂      | rust-dusty mid-dark           | `#203b3b`  |
| Jupiter ♃   | banded gas-giant dark         | `#0e2c2c`  |
| Neptune ♆ ★ | far/cold/deep — brand anchor  | `#061c1d`  |

Neptune is the brand anchor: its `green` is exactly `#45dfa4` by
construction, and its `base` lands at `#061c1d` — OKLCH(L=0.211,
h=197) with chroma calibrated via CIEDE2000 to match the perceived
saturation of Catppuccin Mocha's base at the same role. Every neutral
runs the same calibration so the green tint feels as present (no
more, no less) as Catppuccin's purple tint at each tier. The other
three flavors mirror Catppuccin's Latte / Frappé / Macchiato
progression so switching among them feels familiar to anyone with
calibrated taste for that system.

Every accent's lightness is tuned per-flavor (warm hues lift, cool
hues drop), so yellow reads as proper goldenrod in Mercury rather
than olive sludge.

## Using it

Two audiences:

### Consumers — you want to theme your tool

1. Browse `ports/` and find the directory for your tool.
2. Open `ports/<tool>/dist/` and pick the file matching your flavor.
   Naming is consistent: `startino-<flavor>` for terminal-style
   files, `startino.css` (with all flavors scoped under
   `[data-flavor]`) for web.
3. Read that port's `README.md` for what kind of file it is and how
   the tool consumes it. *Where* the file goes on your machine
   depends on your OS and how that tool finds its config — that's
   between you and the tool's docs. The file itself is already in
   the native format the tool expects.

For web consumers (shadcn-svelte / shadcn-ui / Tailwind v4 /
SvelteKit / Next.js), the `shadcn` port ships both per-flavor files
and a single aggregated `startino.css` with all four flavors scoped
under `[data-flavor]` attributes on the document root. Pick
whichever fits your theme-switching story — build-time selection
versus runtime toggle.

### Maintainers — you want to tweak the palette or add a port

```sh
bun install
just build       # regenerate palette + render every port
just check       # verify every committed dist/ matches its template + palette
just port <n>    # render one port
just test        # unit tests
```

Tweaking the palette: edit `palette/generate.ts`, run `just build`,
commit `palette.json` AND the regenerated port outputs together. CI
rejects PRs where the two have drifted (`prism --check`).

Adding a port: drop a `<tool>.njk` template under `ports/<tool>/`,
run `just port <tool>`, commit the template and `dist/` together.
See [`docs/port-creation.md`](docs/port-creation.md) for the full
recipe — including how to translate an existing Catppuccin port.

## Available ports

| Port      | What it themes                  | File format                |
| --------- | ------------------------------- | -------------------------- |
| `shadcn`  | shadcn-svelte / shadcn-ui (web) | CSS `:root` blocks (OKLCH) |
| `kitty`   | kitty terminal                  | `.conf`                    |
| `ghostty` | ghostty terminal                | extensionless config       |
| `tmux`    | tmux status line + panes        | `.conf`                    |
| `fish`    | fish shell prompt + syntax      | `.theme`                   |
| `waybar`  | Hyprland status bar             | `.css` (`@define-color`)   |

Each port's `README.md` documents its own consumption pattern. Want a
port that isn't here? Follow [`docs/port-creation.md`](docs/port-creation.md)
and submit a PR.

## Style guide

[`docs/style-guide.md`](docs/style-guide.md) codifies the brand
rules: primary is always green (mint), secondary is always pink,
Catppuccin's user-pickable accent rotation is intentionally not
adopted, and syntax-highlighting role assignments mirror Catppuccin
verbatim.

## License

Proprietary — see [LICENSE](LICENSE). The palette and brand colors
are Startino's. Compiler code may be referenced for educational
purposes; direct reuse requires explicit permission.
