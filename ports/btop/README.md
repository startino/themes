# `btop` port

Output: one `dist/startino-<flavor>.theme` file per flavor — full
btop theme files, drop-in compatible with btop's existing
`color_theme` mechanism.

## How to use

1. Symlink (or copy) the dist files into btop's themes directory:

   ```sh
   mkdir -p ~/.config/btop/themes
   ln -sf ~/themes/ports/btop/dist/startino-neptune.theme \
          ~/.config/btop/themes/startino-neptune.theme
   ```

2. In `~/.config/btop/btop.conf`, set:

   ```
   color_theme = "startino-neptune"
   ```

3. Restart btop. (No live-reload — btop reads the theme once at start.)

## Slot mapping

The semantic role of each btop slot (cpu_box, free_start, etc.) is
preserved verbatim from Catppuccin Mocha's btop theme — same gradient
directions, same conceptual color groupings — but each slot resolves
to Startino's value at the matching role. Notably:

- `cpu_box` uses `mauve`, which on Startino collapses to brand pink.
- `proc_box` uses `blue`, which on Startino is brand teal.
- Gradients (free, cached, available, used) follow the same hue
  rotation Catppuccin chose; they read as Startino's brand thanks to
  the slot remap (style guide §7).
