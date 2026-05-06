# Startino Themes — Ghostty

Ghostty terminal themes for all four Startino flavors: Mercury, Mars, Jupiter, and Neptune.

## What this is

Four extensionless theme files for the [Ghostty](https://ghostty.org/) terminal emulator. Each maps the full 16-color ANSI palette plus background, foreground, cursor, and selection colors to the corresponding Startino palette flavor.

## Install

1. Copy the theme file you want into Ghostty's themes directory:

   ```sh
   cp dist/startino-neptune ~/.config/ghostty/themes/
   ```

2. Reference it in `~/.config/ghostty/config`:

   ```
   theme = startino-neptune
   ```

3. Restart Ghostty (or reload config with `Cmd+Shift+,` on macOS).

## Switch flavors

Change the `theme =` line to any of the four flavors:

- `theme = startino-mercury`
- `theme = startino-mars`
- `theme = startino-jupiter`
- `theme = startino-neptune`

## Regenerate

```sh
cd /shared/themes
bun compiler/prism.ts --port ghostty
```
