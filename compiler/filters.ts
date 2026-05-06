/**
 * Nunjucks filters and globals for color formatting.
 * Wire these into the env once via `registerFilters(env)`.
 */

import type * as nunjucks from 'nunjucks';
import type { ColorEntry } from './types.ts';

type AnyEnv = nunjucks.Environment | { addFilter: (name: string, fn: (...args: any[]) => any) => void; addGlobal: (name: string, value: unknown) => void };

const isColor = (v: unknown): v is ColorEntry =>
  typeof v === 'object' && v !== null &&
  'hex' in v && 'rgb' in v && 'hsl' in v && 'oklch' in v;

const lift = <T>(fn: (c: ColorEntry) => T) => (input: unknown): T | unknown => {
  if (isColor(input)) return fn(input);
  // Pass non-color inputs through untouched so nested-filter chains don't crash.
  return input;
};

export function registerFilters(env: AnyEnv): void {
  // === hex variants ===
  env.addFilter('hex',         lift((c) => c.hex));
  env.addFilter('hex_no_hash', lift((c) => c.hex.slice(1)));

  // === rgb variants ===
  env.addFilter('rgb',         lift((c) => `rgb(${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b})`));
  // Modern space-separated CSS: `rgb(R G B)` and `rgb(R G B / A)`
  env.addFilter('css_rgb',     lift((c) => `rgb(${c.rgb.r} ${c.rgb.g} ${c.rgb.b})`));
  // Raw tuple — for shadcn-svelte / Tailwind v3 `theme.colors` convention
  env.addFilter('rgb_tuple',   lift((c) => `${c.rgb.r} ${c.rgb.g} ${c.rgb.b}`));
  env.addFilter('rgb_comma',   lift((c) => `${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b}`));

  // === hsl variants ===
  env.addFilter('hsl',         lift((c) => `hsl(${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%)`));
  env.addFilter('css_hsl',     lift((c) => `hsl(${c.hsl.h} ${c.hsl.s}% ${c.hsl.l}%)`));
  env.addFilter('hsl_tuple',   lift((c) => `${c.hsl.h} ${c.hsl.s}% ${c.hsl.l}%`));

  // === oklch ===
  env.addFilter('css_oklch',   lift((c) => `oklch(${c.oklch.l} ${c.oklch.c} ${c.oklch.h})`));
  env.addFilter('oklch_tuple', lift((c) => `${c.oklch.l} ${c.oklch.c} ${c.oklch.h}`));

  // === channel accessors (less typing in templates) ===
  env.addFilter('r', lift((c) => c.rgb.r));
  env.addFilter('g', lift((c) => c.rgb.g));
  env.addFilter('b', lift((c) => c.rgb.b));

  // === string utilities ===
  env.addFilter('upper_first', (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
}
