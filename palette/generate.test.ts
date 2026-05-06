import { describe, expect, test } from 'bun:test';
import { differenceCiede2000 } from 'culori';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ACCENTS, FLAVORS, buildPalette } from './generate.ts';

const palette = buildPalette() as Record<string, any>;

describe('palette structure', () => {
  test('has 4 planet flavors', () => {
    const flavorIds = Object.keys(palette).filter((k) => !k.startsWith('$') && k !== 'version');
    expect(flavorIds.sort()).toEqual(['jupiter', 'mars', 'mercury', 'neptune']);
  });

  test('top-level has $schema and version', () => {
    expect(palette.$schema).toBe('./palette.schema.json');
    expect(palette.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  for (const flavor of FLAVORS) {
    test(`${flavor.name} has 26 colors and 8 ansi groups`, () => {
      const f = palette[flavor.id];
      expect(Object.keys(f.colors)).toHaveLength(26);
      expect(Object.keys(f.ansiColors)).toHaveLength(8);
    });

    test(`${flavor.name} colors carry full schema (hex/rgb/hsl/oklch/accent)`, () => {
      const f = palette[flavor.id];
      for (const [id, c] of Object.entries(f.colors) as [string, any][]) {
        expect(c.hex, `${flavor.id}.${id}.hex`).toMatch(/^#[0-9a-f]{6}$/);
        expect(c.rgb).toEqual(expect.objectContaining({
          r: expect.any(Number), g: expect.any(Number), b: expect.any(Number),
        }));
        expect(c.hsl).toEqual(expect.objectContaining({
          h: expect.any(Number), s: expect.any(Number), l: expect.any(Number),
        }));
        expect(c.oklch).toEqual(expect.objectContaining({
          l: expect.any(Number), c: expect.any(Number), h: expect.any(Number),
        }));
        expect(typeof c.accent).toBe('boolean');
      }
    });
  }
});

describe('brand anchors', () => {
  test('Neptune base is exactly #171919', () => {
    expect(palette.neptune.colors.base.hex).toBe('#171919');
  });

  test('Neptune green is exactly #45dfa4 (mint primary)', () => {
    expect(palette.neptune.colors.green.hex).toBe('#45dfa4');
  });

  test('green carries alias=primary', () => {
    expect(palette.neptune.colors.green.alias).toBe('primary');
    expect(palette.mercury.colors.green.alias).toBe('primary');
  });

  test('pink carries alias=secondary', () => {
    expect(palette.neptune.colors.pink.alias).toBe('secondary');
    expect(palette.mercury.colors.pink.alias).toBe('secondary');
  });
});

describe('per-flavor accent L tuning (Catppuccin methodology)', () => {
  // Accents intentionally differ in L within a flavor — that's the whole point
  // of per-flavor tuning. What we assert instead:
  //   1. Brand anchors land exactly.
  //   2. The Catppuccin L map was applied (spot-check a few values).
  //   3. Dark flavors visually differ from each other (Neptune L ≠ Mars L).

  test('Mercury yellow oklch.l ≈ Catppuccin Latte yellow L (0.714)', () => {
    const l = palette.mercury.colors.yellow.oklch.l;
    expect(Math.abs(l - 0.714)).toBeLessThan(0.01);
  });

  test('Mercury mauve oklch.l ≈ Catppuccin Latte mauve L (0.555)', () => {
    const l = palette.mercury.colors.mauve.oklch.l;
    expect(Math.abs(l - 0.555)).toBeLessThan(0.01);
  });

  test('Neptune mauve oklch.l ≈ Catppuccin Mocha mauve L (0.787)', () => {
    const l = palette.neptune.colors.mauve.oklch.l;
    expect(Math.abs(l - 0.787)).toBeLessThan(0.01);
  });

  test('dark flavors have distinct mauve L values (Mars ≠ Jupiter ≠ Neptune)', () => {
    const marsL    = palette.mars.colors.mauve.oklch.l;
    const jupiterL = palette.jupiter.colors.mauve.oklch.l;
    const neptuneL = palette.neptune.colors.mauve.oklch.l;
    // Each should differ by at least 0.005 from its neighbor
    expect(Math.abs(marsL - jupiterL)).toBeGreaterThan(0.005);
    expect(Math.abs(jupiterL - neptuneL)).toBeGreaterThan(0.005);
  });
});

describe('determinism', () => {
  test('two builds produce identical JSON', () => {
    const a = JSON.stringify(buildPalette());
    const b = JSON.stringify(buildPalette());
    expect(a).toEqual(b);
  });

  test('committed palette.json matches a fresh build', () => {
    // Acceptance for CI: if generate.ts changes its inputs, palette.json
    // must be regenerated and committed in the same change.
    const onDisk = readFileSync(join(import.meta.dir, 'palette.json'), 'utf8');
    const fresh = JSON.stringify(buildPalette(), null, 2) + '\n';
    expect(onDisk).toEqual(fresh);
  });
});

describe('ansi mapping', () => {
  test('codes are 0..7 normal, 8..15 bright', () => {
    const ansi = palette.neptune.ansiColors;
    for (const [name, entry] of Object.entries(ansi) as [string, any][]) {
      expect(entry.normal.code).toBeGreaterThanOrEqual(0);
      expect(entry.normal.code).toBeLessThanOrEqual(7);
      expect(entry.bright.code).toBe(entry.normal.code + 8);
    }
  });
});

describe('gamut clamp diagnostics', () => {
  // Pink is the most aggressive accent (C=0.22 at H=352) — record where
  // sRGB clamping bit so future hue tweaks are visible.
  test('Neptune pink sits at requested L within 0.01 (Mocha pink L = 0.870)', () => {
    const o = palette.neptune.colors.pink.oklch;
    expect(Math.abs(o.l - 0.870)).toBeLessThan(0.01);
  });

  test('Neptune red and pink are visually distinguishable', () => {
    // Both are in the red/pink hue family at the same L. They must be far
    // enough apart that a viewer reads them as different colors, not just
    // shades of the same.
    const dE = differenceCiede2000()(
      palette.neptune.colors.red.hex,
      palette.neptune.colors.pink.hex,
    );
    expect(dE).toBeGreaterThan(5);
  });
});
