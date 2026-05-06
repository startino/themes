# `mako` port

Output: one `dist/startino-<flavor>.config` per flavor — a full,
drop-in mako config. Mako has no `@import` or `include` directive,
so the whole config (settings + colors) is templated.

## How to use

Symlink or copy the dist file as your mako config:

```sh
ln -sf ~/themes/ports/mako/dist/startino-neptune.config \
       ~/.config/mako/config
```

Then reload mako:

```sh
makoctl reload
```

## Tweaking settings

Because the whole config is templated, changing a non-color setting
(default-timeout, anchor, layer, etc.) means editing the template
at `ports/mako/mako.njk` and running `bun compiler/prism.ts --port mako`.
This is intentional — keeping a single source of truth means flavor
switches don't risk losing your settings.

## Color choices

- `background-color` = `base`
- `text-color` = `text`
- `border-color` = `green` (brand primary — notifications stand out
  in mint, not Catppuccin's mauve)
- `progress-color` overlay = `surface0` (soft tinted progress bar)
- `[urgency=high]` border = `peach` (warm warning — distinct from
  the default green border without going to red, which we reserve
  for actual errors and destructive actions)
