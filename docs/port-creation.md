# Creating a New Port

A port adapts a Startino theme flavor to a specific application's configuration
or styling format. This document walks you from zero to a merged port.

---

## 1. Find a Catppuccin Equivalent

Catppuccin maintains 200+ ports at [github.com/catppuccin](https://github.com/catppuccin).
Before writing a template from scratch, check whether a Catppuccin port already
exists for your target application:

```
https://github.com/catppuccin/<app-name>
```

If it exists, use it as your starting template. If it doesn't, you'll need to
consult the application's theming documentation and write the template manually.

---

## 2. Translate Tera → Nunjucks

Catppuccin templates are written in [Tera](https://keats.github.io/tera/).
Startino's compiler uses [Nunjucks](https://mozilla.github.io/nunjucks/). The
two languages are ~95% compatible at the syntax level.

**Things that work unchanged:**
- `{% set x = y %}` — identical in both
- `{{ x }}` — identical in both
- `{% for item in list %}` / `{% endfor %}`
- `{% if condition %}` / `{% endif %}`
- Most string and math operations

**Things to verify:**
- Filter names: Catppuccin's `css_rgb` filter is available as `css_rgb` in our
  compiler. See `compiler/filters.ts` for the complete registered filter list
  before assuming a filter exists.
- Tera's `| split(pat=",")` → Nunjucks `| split(",")` (no named arg)
- Tera macros (`{% macro name() %}`) have no direct equivalent; refactor into
  Nunjucks `{% macro name() %}` (same keyword, slightly different scoping rules)

When in doubt, compile early and read the error output — the Nunjucks error
messages are descriptive.

---

## 3. Replace Strings

After adapting the template syntax, do a mechanical find-and-replace for all
flavor and brand identifiers:

| Find          | Replace      |
|---------------|--------------|
| `catppuccin`  | `startino`   |
| `Catppuccin`  | `Startino`   |
| `Mocha`       | `Neptune`    |
| `Macchiato`   | `Jupiter`    |
| `Frappé`      | `Mars`       |
| `Latte`       | `Mercury`    |

Update any `filename:` template expressions that interpolate the flavor name to
use the Startino flavor identifiers (`neptune`, `jupiter`, `mars`, `mercury`).

Example diff:
```diff
-# filename: catppuccin-{{ flavor.name | lower }}.conf
+# filename: startino-{{ flavor.identifier }}.conf
```

---

## 4. Drop Into `ports/<name>/`

Create a directory named after the target application:

```
ports/
  <name>/
    <name>.njk        ← the Nunjucks template
    README.md         ← brief description, install instructions, screenshot
```

The README should cover: what the application is, where to put the compiled
output, and any application-side steps needed to activate the theme.

---

## 5. Run Prism

Compile all flavors from your template:

```sh
bun compiler/prism.ts --port <name>
```

The compiler writes per-flavor output files into `ports/<name>/dist/`. Verify
that four files were produced (one per flavor) and spot-check that the color
values look correct.

If the compiler errors, check filter names against `compiler/filters.ts` and
confirm all template variables referenced in the template are present in the
palette.

---

## 6. Commit

Stage the template, compiled dist, and README together in one commit:

```sh
git add ports/<name>/
git commit -m "feat(ports): add <name> port"
```

Do not commit partial states (template without dist, or dist without template).

---

## Frontmatter Cheat Sheet

Templates may include a YAML frontmatter block fenced by `---`. Recognized fields:

| Field           | Type            | Description                                              |
|-----------------|-----------------|----------------------------------------------------------|
| `prism.version` | string          | Minimum compiler version required (semver)               |
| `filename`      | string/template | Output filename pattern; may use `{{ flavor.identifier }}`|
| `matrix`        | list of strings | Restrict compilation to these flavor identifiers only    |
| `skip`          | boolean         | Set `true` to exclude this port from `--all` batch runs  |

All fields are optional. If `filename` is omitted, the compiler uses
`<port-name>-{{ flavor.identifier }}.<detected-extension>`.
