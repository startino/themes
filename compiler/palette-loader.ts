/**
 * Load `palette/palette.json` into the typed `Palette` shape consumed by
 * the renderer.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Flavor, Palette } from './types.ts';

const REPO_ROOT = join(import.meta.dir, '..');

export const FLAVOR_IDS = ['mercury', 'mars', 'jupiter', 'neptune'] as const;

export function loadPalette(palettePath?: string): Palette {
  const path = palettePath ?? join(REPO_ROOT, 'palette', 'palette.json');
  const raw = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;

  const flavors: Flavor[] = [];
  for (const id of FLAVOR_IDS) {
    const f = raw[id] as any;
    if (!f) throw new Error(`palette.json missing flavor "${id}"`);
    flavors.push({
      identifier: id,
      name: f.name,
      emoji: f.emoji,
      order: f.order,
      dark: f.dark,
      light: !f.dark,
      colors: f.colors,
      ansiColors: f.ansiColors,
    });
  }
  flavors.sort((a, b) => a.order - b.order);

  const flavorsById: Record<string, Flavor> = {};
  for (const f of flavors) flavorsById[f.identifier] = f;

  return {
    version: (raw.version as string) ?? '0.0.0',
    flavors,
    flavorsById,
  };
}

export const ACCENT_IDS = [
  'rosewater', 'flamingo', 'pink', 'mauve', 'red', 'maroon',
  'peach', 'yellow', 'green', 'teal', 'sky', 'sapphire',
  'blue', 'lavender',
] as const;

export const NEUTRAL_IDS = [
  'text', 'subtext1', 'subtext0',
  'overlay2', 'overlay1', 'overlay0',
  'surface2', 'surface1', 'surface0',
  'base', 'mantle', 'crust',
] as const;
