# Startino Themes

Catppuccin-style theme system for Startino. One palette, many ports.

- **Palette** — `palette/palette.json` is the canonical artifact, generated from `palette/generate.ts`.
- **Compiler** — `compiler/prism.ts` renders Nunjucks port templates against the palette.
- **Ports** — `ports/<tool>/` per-tool theme generators (Tailwind, shadcn-svelte, tmux, fish, …).
- **Style guide** — `docs/style-guide.md` codifies role assignments and brand rules.

## Quick start

```sh
bun install
just build       # generate palette + render all ports
just check       # verify dist/ is in sync with templates
just port <name> # render one port
```

## Flavors

| Flavor  | Mood                          | Base hex   |
| ------- | ----------------------------- | ---------- |
| Mercury | sun-bleached light            | ≈`#eef2f2` |
| Mars    | rust-dusty mid-dark           | ≈`#2e3232` |
| Jupiter | banded gas-giant mid-dark     | ≈`#232627` |
| Neptune | far/cold/deep — anchor (dark) | `#171919`  |

## Adding a port

See [`docs/port-creation.md`](docs/port-creation.md). Roughly: drop a
`*.njk` template into `ports/<tool>/`, run `just port <tool>`, commit
the generated `dist/` alongside.

## License

Proprietary. See [LICENSE](LICENSE).
