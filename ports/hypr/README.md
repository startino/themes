# `hypr` port

Output: one `dist/startino-<flavor>.conf` per flavor — Hyprland
variable definitions for the colors that Hyprland actually exposes
(border, shadow, group, background).

## How to use

1. Symlink (or copy) the dist file somewhere your Hyprland config can
   reach. **Important:** put it in a directory that your wildcard
   sources don't already cover, otherwise Hyprland will double-source
   it and emit duplicate-variable warnings:

   ```sh
   mkdir -p ~/.config/hypr/colors
   ln -sf ~/themes/ports/hypr/dist/startino-neptune.conf \
          ~/.config/hypr/colors/startino-neptune.conf
   ```

2. In your top-level Hyprland config (or wherever you `source` from),
   load the color file **before** any file that references the
   variables — variables are scoped by source order:

   ```conf
   source = ~/.config/hypr/colors/startino-neptune.conf
   source = ~/.config/hypr/your-other-stuff/**.conf
   ```

3. Reference the variables in your `general` / `decoration` /
   `group` blocks:

   ```conf
   general {
     col.active_border = $startino_active_border_a $startino_active_border_b 45deg
     col.inactive_border = $startino_inactive_border
   }

   misc {
     background_color = $startino_background  # also accepts 0xAARRGGBB literal
   }

   group {
     col.border_active = $startino_group_active
     col.border_inactive = $startino_group_inactive
     col.border_locked_active = $startino_group_locked
   }
   ```

4. Reload: `hyprctl reload`.

## What's exposed

| Variable                         | Resolves to     | Use                                              |
| -------------------------------- | --------------- | ------------------------------------------------ |
| `$startino_brand_primary`        | `green` (mint)  | Brand primary, accent borders                    |
| `$startino_brand_secondary`      | `pink`          | Brand secondary, accent borders                  |
| `$startino_active_border_a`      | brand primary   | First stop of active-window gradient             |
| `$startino_active_border_b`      | brand secondary | Second stop of active-window gradient            |
| `$startino_inactive_border`      | `overlay0`      | Inactive window border                           |
| `$startino_background`           | `base`          | Compositor fallback bg (visible when no wallpaper) |
| `$startino_shadow`               | `crust`         | Window shadow                                     |
| `$startino_group_active`         | brand primary   | Active grouped-window border                     |
| `$startino_group_inactive`       | `surface1`      | Inactive grouped-window border                   |
| `$startino_group_locked`         | `red`           | Locked group (destructive state)                 |

## Why a dedicated colors file (and not just `general.conf`)

Hyprland config tends to spread color references across many files
(`general`, `decoration`, `group`, `misc`, …). Centralizing the values
as variables means flavor switching is one `source =` line, and any
custom blocks of yours that reference the same variables flip in lockstep.
