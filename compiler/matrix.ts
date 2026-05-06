/**
 * Cartesian-product expansion over the matrix axes declared in a template's
 * frontmatter.
 *
 * Built-in axes:
 * - `flavor` — expands to all 4 flavors (passed in from the loaded palette).
 * - `accent` — expands to all 14 accent ids.
 *
 * Custom axes: any other top-level frontmatter key whose value is an array
 * becomes an iterable axis (Whiskers-compat).
 */

import type { Frontmatter, Palette } from './types.ts';
import { ACCENT_IDS } from './palette-loader.ts';

export type MatrixCombination = Record<string, unknown>;

export type MatrixOptions = {
  /** Restrict `flavor` axis to a single flavor id */
  onlyFlavor?: string;
};

export function expandMatrix(
  fm: Frontmatter,
  palette: Palette,
  opts: MatrixOptions = {},
): MatrixCombination[] {
  const axes = fm.matrix ?? [];

  // Empty matrix → one render with no per-iteration variable.
  if (axes.length === 0) return [{}];

  const axisValues: Array<{ name: string; values: unknown[] }> = [];

  for (const axis of axes) {
    if (axis === 'flavor') {
      const flavors = opts.onlyFlavor
        ? palette.flavors.filter((f) => f.identifier === opts.onlyFlavor)
        : palette.flavors;
      if (opts.onlyFlavor && flavors.length === 0) {
        throw new Error(`Unknown flavor: ${opts.onlyFlavor}`);
      }
      axisValues.push({ name: 'flavor', values: flavors });
    } else if (axis === 'accent') {
      axisValues.push({ name: 'accent', values: ACCENT_IDS as readonly string[] as string[] });
    } else if (Array.isArray(fm[axis])) {
      axisValues.push({ name: axis, values: fm[axis] as unknown[] });
    } else {
      throw new Error(
        `Unknown matrix axis "${axis}". Built-ins: flavor, accent. ` +
        `Custom axes must declare an array under their name in frontmatter.`,
      );
    }
  }

  // Cartesian
  const out: MatrixCombination[] = [{}];
  for (const { name, values } of axisValues) {
    const next: MatrixCombination[] = [];
    for (const partial of out) {
      for (const v of values) {
        next.push({ ...partial, [name]: v });
      }
    }
    out.length = 0;
    out.push(...next);
  }
  return out;
}
