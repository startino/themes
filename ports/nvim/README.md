# `nvim` port

Output: a single `dist/startino.lua` module that returns a
`color_overrides` table for the [catppuccin/nvim](https://github.com/catppuccin/nvim)
plugin. Catppuccin slot names are kept for plugin compatibility, but
the hex each slot emits is Startino's — see the style guide §7.

## How to use

This port relies on `catppuccin/nvim` already being installed; it
doesn't replace the plugin, it overrides its palette.

1. Make sure `dist/startino.lua` is on your nvim Lua path. The
   simplest way: symlink it into your nvim `lua/` directory:

   ```sh
   ln -sf ~/themes/ports/nvim/dist/startino.lua ~/.config/nvim/lua/startino.lua
   ```

2. In your catppuccin plugin spec, set `flavour` and pass
   `color_overrides`:

   ```lua
   {
     "catppuccin/nvim",
     opts = {
       flavour = "mocha", -- maps to Startino Neptune (brand anchor)
       color_overrides = require("startino"),
       integrations = { ... },
     },
   }
   ```

Flavor pairing matches the rest of the Startino theme system:

| Catppuccin flavour | Startino flavor |
| ------------------ | --------------- |
| `latte`            | Mercury ☿       |
| `frappe`           | Mars ♂          |
| `macchiato`        | Jupiter ♃       |
| `mocha`            | Neptune ♆ ★     |

## Why `color_overrides` instead of a fork

Catppuccin nvim has hundreds of integration files (treesitter, telescope,
gitsigns, lualine, etc.) that all read from its palette. Forking the
plugin to swap colors would mean maintaining all of that. The
`color_overrides` API the plugin already exposes lets us swap the
26 named slots while inheriting every integration verbatim — exactly
the mechanism Catppuccin built for downstream brand customisation.
