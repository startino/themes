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
| Neptune ♆ ★ | far/cold/deep — brand anchor  | `#102424`  |

Neptune is the brand anchor: its `green` is exactly `#45dfa4` by
construction, and its `base` lands at `#102424` — OKLCH(L=0.243,
h=197) so depth matches Catppuccin Mocha's base exactly; only hue
differs. Chroma is calibrated via CIEDE2000 to match the perceived
saturation of Mocha's base at the same role. Every neutral runs the
same calibration so the green tint feels as present (no more, no
less) as Catppuccin's purple tint at each tier. The other three
flavors mirror Catppuccin's Latte / Frappé / Macchiato progression so
switching among them feels familiar to anyone with calibrated taste
for that system.

Every accent's lightness is tuned per-flavor (warm hues lift, cool
hues drop), so yellow reads as proper goldenrod in Mercury rather
than olive sludge.

## Available ports

| Port      | What it themes                       | File format                |
| --------- | ------------------------------------ | -------------------------- |
| `shadcn`  | shadcn-svelte / shadcn-ui (web)      | CSS `:root` blocks (OKLCH) |
| `kitty`   | kitty terminal                       | `.conf`                    |
| `ghostty` | ghostty terminal                     | extensionless config       |
| `tmux`    | tmux status line + panes             | `.conf`                    |
| `fish`    | fish shell prompt + syntax           | `.theme`                   |
| `waybar`  | Hyprland status bar                  | `.css` (`@define-color`)   |
| `nvim`    | Neovim (`catppuccin/nvim` plugin)    | `.lua` (`color_overrides`) |
| `btop`    | btop process viewer                  | `.theme`                   |
| `mako`    | mako notification daemon             | drop-in config             |
| `hypr`    | Hyprland (border, group, shadow, bg) | `.conf` (variables)        |

Each port's `README.md` documents its own consumption pattern in
detail. The sections below give the cross-port quick-start with
caveats — especially the tmux integration, which has non-obvious
sharp edges.

---

## Install per port

> All examples assume the repo is cloned at `~/themes`. Linux paths
> follow XDG defaults (`$XDG_CONFIG_HOME ?= ~/.config`); on macOS,
> `~/Library/Application Support/<tool>` is the closest equivalent
> for tools that respect it (kitty, fish), but most tools listed
> here happily read `~/.config/<tool>` on macOS too.

### shadcn

Web stack — shadcn-svelte / shadcn-ui / Tailwind v4 / SvelteKit /
Next.js. Two shipping modes:

- `dist/startino-<flavor>.css` — one file per flavor, `:root { --background: oklch(...); ... }`. Use when you pick a flavor at build time.
- `dist/startino.css` — all four flavors in one file, scoped under `[data-flavor="..."]` attributes on the document root. Use when you want runtime flavor toggling.

```html
<!-- runtime toggle -->
<html data-flavor="neptune">
  <link rel="stylesheet" href="/path/to/startino.css">
```

```css
/* build-time -- import the per-flavor file */
@import "~/themes/ports/shadcn/dist/startino-neptune.css";
```

### kitty

```sh
ln -sf ~/themes/ports/kitty/dist/startino-neptune.conf ~/.config/kitty/themes/startino-neptune.conf
```

In `~/.config/kitty/kitty.conf`:

```conf
include themes/startino-neptune.conf
```

Reload with `ctrl+shift+f5` (or kill & restart). Live windows do not
recolor unless you've configured remote control: set
`allow_remote_control yes` and `listen_on unix:/tmp/mykitty` in
kitty.conf, then `kitty @ --to unix:/tmp/mykitty set-colors --all
--configured ~/.config/kitty/themes/startino-neptune.conf`.

### ghostty

The dist file is the actual Ghostty config — no extension. Drop it in
Ghostty's themes dir and reference it:

```sh
mkdir -p ~/.config/ghostty/themes
cp ~/themes/ports/ghostty/dist/startino-neptune ~/.config/ghostty/themes/startino-neptune
```

```conf
# ~/.config/ghostty/config
theme = startino-neptune
```

Ghostty hot-reloads the config on save (cmd+shift+,).

### tmux

This one has the most subtle integration. The dist files are named
`catppuccin_<flavor>_tmux.conf` because they're meant to be dropped
*into* the [`catppuccin/tmux`](https://github.com/catppuccin/tmux)
plugin's `themes/` directory — the plugin then loads them when you
set `@catppuccin_flavor`. We piggyback on Catppuccin's plugin to get
all the status-line rendering for free; only the palette swaps.

#### Setup

```sh
# Assuming you use TPM at ~/.config/tmux/plugins/
mkdir -p ~/.config/tmux/plugins/tmux/themes
ln -sf ~/themes/ports/tmux/dist/catppuccin_neptune_tmux.conf \
       ~/.config/tmux/plugins/tmux/themes/catppuccin_neptune_tmux.conf
```

In `tmux.conf`:

```tmux
set -g @plugin "catppuccin/tmux"
set -g @catppuccin_flavor "neptune"
# … your @catppuccin_window_status_style and other customizations …
run "~/.config/tmux/plugins/tpm/tpm"
```

Reload: `tmux source-file ~/.config/tmux/tmux.conf`.

#### Gotchas (read these — they bit us hard)

1. **Flavor-switching needs a surgical palette reset.** The plugin
   loads its palette via `set -ogq @thm_*`, where `-ogq` means *only
   set if not already set*. So if you switch flavors at runtime
   (sourcing tmux.conf again), the new flavor's `@thm_*` values are
   silently ignored — the old palette persists. Workaround: in your
   `tmux.conf`, **before** the `run` line that loads catppuccin/tmux,
   explicitly unset every `@thm_*` slot:

   ```tmux
   set -gu @thm_rosewater
   set -gu @thm_flamingo
   set -gu @thm_pink
   set -gu @thm_mauve
   set -gu @thm_red
   set -gu @thm_maroon
   set -gu @thm_peach
   set -gu @thm_yellow
   set -gu @thm_green
   set -gu @thm_teal
   set -gu @thm_sky
   set -gu @thm_sapphire
   set -gu @thm_blue
   set -gu @thm_lavender
   set -gu @thm_text
   set -gu @thm_subtext_1
   set -gu @thm_subtext_0
   set -gu @thm_overlay_2
   set -gu @thm_overlay_1
   set -gu @thm_overlay_0
   set -gu @thm_surface_2
   set -gu @thm_surface_1
   set -gu @thm_surface_0
   set -gu @thm_bg
   set -gu @thm_mantle
   set -gu @thm_crust
   ```

2. **Window-status separators stick too.** The same staleness affects
   `@catppuccin_window_*_separator` — after a flavor switch the active
   tab can render with squared corners while the new theme expects
   rounded. Add to the same reset block:

   ```tmux
   set -gu @catppuccin_window_left_separator
   set -gu @catppuccin_window_right_separator
   set -gu @catppuccin_window_middle_separator
   set -gu @catppuccin_window_number_position
   set -gu @catppuccin_window_current_left_separator
   set -gu @catppuccin_window_current_right_separator
   set -gu @catppuccin_window_current_middle_separator
   set -gu @catppuccin_window_current_number_position
   set -gu @catppuccin_window_status_style
   ```

3. **Don't use `@catppuccin_reset "true"` instead.** The plugin offers
   this as a one-liner reset, but it *also* unsets
   `@catppuccin_window_status_style`,
   `@catppuccin_window_default_text`,
   `@catppuccin_window_current_text`, all `@catppuccin_window_flags_*`,
   and roughly 30 other slots. If you customize any of those, the
   reset wipes them. The surgical block above only touches the
   palette + separators.

4. **Filename convention is load-bearing.** Don't rename the dist
   file — `catppuccin_<flavor>_tmux.conf` is the format the
   `catppuccin/tmux` plugin expects to find for each `@catppuccin_flavor`
   value. The flavor names mercury / mars / jupiter / neptune extend
   the plugin's set; it accepts arbitrary names as long as the file is
   in `themes/`.

### fish

```sh
mkdir -p ~/.config/fish/themes
cp "~/themes/ports/fish/dist/Startino Neptune.theme" "~/.config/fish/themes/Startino Neptune.theme"
```

Then in fish:

```fish
fish_config theme save "Startino Neptune"
```

Or equivalently, source the colors from `conf.d/`:

```fish
# ~/.config/fish/conf.d/startino.fish
set -g fish_color_normal cbecec
set -g fish_color_command 3bddc8
# ... (paste from the .theme file, dropping the # prefix)
```

The `conf.d` approach is more robust for dotfile management — themes
saved via `fish_config` get rewritten into `fish_variables`, which is
runtime state.

### waybar

```sh
mkdir -p ~/.config/waybar/themes
ln -sf ~/themes/ports/waybar/dist/startino-neptune.css \
       ~/.config/waybar/themes/startino-neptune.css
```

In `~/.config/waybar/style.css`:

```css
@import "themes/startino-neptune.css";

/* Use palette variables in your styles */
window#waybar { background-color: @crust; }
#clock { color: @blue; }
#pulseaudio { color: @mauve; }   /* renders as Startino pink */
```

Reload waybar: `pkill -SIGUSR2 waybar`.

**Gotcha:** if you've copy-pasted any `format` strings from upstream
Catppuccin examples, check for inline pango overrides like
`<span color='#cba6f7'>{icon}</span>`. Hardcoded hexes inside format
strings shadow the CSS palette variables on the wrapped character —
you'll see e.g. an icon in Catppuccin purple while the surrounding
text uses Startino pink. Strip the spans; let the CSS handle it.

### nvim

The port produces a Lua `color_overrides` table for the
[`catppuccin/nvim`](https://github.com/catppuccin/nvim) plugin. We
don't fork the plugin; we override its palette via the API it
already exposes. Inherits every Catppuccin integration verbatim.

```sh
ln -sf ~/themes/ports/nvim/dist/startino.lua \
       ~/.config/nvim/lua/startino.lua
```

In your plugin spec (lazy.nvim shown):

```lua
{
  "catppuccin/nvim",
  name = "catppuccin",
  opts = {
    flavour = "mocha", -- maps to Startino Neptune (brand anchor)
    color_overrides = require("startino"),
    integrations = { ... },
  },
}
```

Restart nvim, or run `:colorscheme catppuccin` in an existing session.

**Flavor pairing**: `latte` ← Mercury, `frappe` ← Mars, `macchiato` ←
Jupiter, `mocha` ← Neptune.

### btop

```sh
mkdir -p ~/.config/btop/themes
ln -sf ~/themes/ports/btop/dist/startino-neptune.theme \
       ~/.config/btop/themes/startino-neptune.theme
```

In `~/.config/btop/btop.conf`:

```
color_theme = "startino-neptune"
```

**Gotcha:** btop reads its theme once at startup — there's no
live-reload. Restart btop after switching themes.

### mako

Mako has no `@import` directive, so the whole config (settings +
colors) is templated. Drop in the dist as your config:

```sh
ln -sf ~/themes/ports/mako/dist/startino-neptune.config \
       ~/.config/mako/config
makoctl reload
```

To tweak non-color settings (default-timeout, anchor, etc.) edit the
template at `ports/mako/mako.njk` and re-render with
`bun compiler/prism.ts --port mako`. Keeping a single source of truth
means flavor switches don't risk losing settings.

### hypr

Hyprland needs colors as variable definitions because they're spread
across `general`, `decoration`, `group`, `misc`. Centralize via:

```sh
mkdir -p ~/.config/hypr/colors
ln -sf ~/themes/ports/hypr/dist/startino-neptune.conf \
       ~/.config/hypr/colors/startino-neptune.conf
```

In your top-level Hyprland config — **source the colors file BEFORE
any file that references the variables**, since Hyprland binds
variables in source order:

```conf
source = ~/.config/hypr/colors/startino-neptune.conf
source = ~/.config/hypr/your-other-stuff/**.conf
```

Then reference variables in your config blocks:

```conf
general {
  col.active_border   = $startino_active_border_a $startino_active_border_b 45deg
  col.inactive_border = $startino_inactive_border
}

misc {
  background_color = 0x102424   # see gotcha #2 below
}

group {
  col.border_active        = $startino_group_active
  col.border_inactive      = $startino_group_inactive
  col.border_locked_active = $startino_group_locked
}
```

Reload: `hyprctl reload`.

**Gotchas:**

1. **Don't put the colors file in a directory that's already
   wildcard-sourced.** If your config has
   `source = ~/.config/hypr/themes/**.conf` and you place
   `startino-neptune.conf` under that path, Hyprland will source it
   twice and warn about duplicate variable definitions. Use a
   separate dir (e.g. `colors/`).
2. **`misc:background_color` doesn't accept variables in older
   Hyprland versions.** Stick to the literal `0xAARRGGBB` form there
   and copy the value from the dist file's
   `$startino_background` line.

---

## For maintainers

```sh
bun install
just build       # regenerate palette + render every port
just check       # verify every committed dist/ matches its template + palette
just port <name> # render one port
just test        # unit tests
```

Tweaking the palette: edit `palette/generate.ts`, run `just build`,
commit `palette.json` AND the regenerated port outputs together. CI
rejects PRs where the two have drifted (`prism --check`).

Adding a port: drop a `<tool>.njk` template under `ports/<tool>/`,
run `just port <tool>`, commit the template and `dist/` together.
See [`docs/port-creation.md`](docs/port-creation.md) for the full
recipe — including how to translate an existing Catppuccin port.

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
