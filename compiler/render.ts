/**
 * Render one parsed template against the palette, expanding the matrix and
 * producing one output per combination.
 *
 * This module is pure: it doesn't touch the filesystem (other than reading
 * the template — handled by `parseTemplate` upstream). The CLI in
 * `prism.ts` decides whether to write or diff.
 */

import { dirname, isAbsolute, join } from 'node:path';
import { expandMatrix, type MatrixCombination, type MatrixOptions } from './matrix.ts';
import { makeEnv, parseTemplate, type ParsedTemplate } from './template.ts';
import type { Flavor, Palette, RenderContext, RenderOutput } from './types.ts';

export type RenderOptions = MatrixOptions & {
  /**
   * Where to resolve relative `filename` paths against. Defaults to the
   * directory containing the template.
   */
  outputBase?: string;
};

/**
 * Render a template file into 0-N outputs.
 */
export function renderTemplate(
  templatePath: string,
  palette: Palette,
  options: RenderOptions = {},
): RenderOutput[] {
  const tpl = parseTemplate(templatePath);
  return renderParsed(tpl, palette, options);
}

export function renderParsed(
  tpl: ParsedTemplate,
  palette: Palette,
  options: RenderOptions = {},
): RenderOutput[] {
  const env = makeEnv(tpl.path);
  const outputBase = options.outputBase ?? dirname(tpl.path);
  const combinations = expandMatrix(tpl.frontmatter, palette, options);
  const out: RenderOutput[] = [];

  for (const combo of combinations) {
    if (shouldSkip(env, tpl.frontmatter.skip, combo, palette)) continue;

    const ctx = buildContext(combo, palette);
    const filenameRendered = env.renderString(tpl.frontmatter.filename, ctx);
    const path = isAbsolute(filenameRendered)
      ? filenameRendered
      : join(outputBase, filenameRendered);
    const body = env.renderString(tpl.body, ctx);

    out.push({ path, body, combination: combo });
  }

  return out;
}

function shouldSkip(
  env: ReturnType<typeof makeEnv>,
  skipExpr: string | undefined,
  combo: MatrixCombination,
  palette: Palette,
): boolean {
  if (!skipExpr) return false;
  const ctx = buildContext(combo, palette);
  // Render the skip expression as a string, then coerce. Anything other than
  // "true" or "True" or "1" is treated as falsy — keeps templates close to
  // Whiskers' Tera semantics.
  const rendered = env.renderString(`{{ ${skipExpr} }}`, ctx).trim().toLowerCase();
  return rendered === 'true' || rendered === '1';
}

function buildContext(combo: MatrixCombination, palette: Palette): RenderContext {
  const ctx: RenderContext = {
    flavors: palette.flavors,
    flavorsById: palette.flavorsById,
  };

  // If the matrix iterated over flavor, populate flavor-specific helpers.
  if (combo.flavor) {
    const flavor = combo.flavor as Flavor;
    ctx.flavor = flavor;

    // Flatten the flavor's colors so templates can write `{{ green.hex }}`
    // (Whiskers convention) as well as `{{ flavor.colors.green.hex }}`.
    for (const [id, color] of Object.entries(flavor.colors)) {
      ctx[id] = color;
    }

    // Brand aliases — current flavor's mint and pink, available as
    // `{{ primary.hex }}` / `{{ secondary.hex }}`.
    ctx.primary = flavor.colors.green;
    ctx.secondary = flavor.colors.pink;
  }

  // If the matrix iterated over accent, expose the resolved color in the
  // current flavor (if a flavor is also in scope).
  if (combo.accent) {
    const accentId = combo.accent as string;
    ctx.accent = accentId;
    if (ctx.flavor) ctx.accentColor = ctx.flavor.colors[accentId];
  }

  // Pass through any custom axes verbatim.
  for (const [k, v] of Object.entries(combo)) {
    if (k !== 'flavor' && k !== 'accent') ctx[k] = v;
  }

  return ctx;
}
