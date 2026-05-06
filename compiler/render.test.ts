/**
 * Unit tests for compiler/render.ts
 * Uses real fixture .njk files from compiler/fixtures/.
 */

import { describe, test, expect, beforeAll } from 'bun:test';
import { join } from 'node:path';
import { renderTemplate, renderParsed } from './render.ts';
import { parseTemplate } from './template.ts';
import { loadPalette } from './palette-loader.ts';
import type { Palette } from './types.ts';

let palette: Palette;
const FIXTURES = join(import.meta.dir, 'fixtures');

function fixture(name: string): string {
  return join(FIXTURES, name);
}

beforeAll(() => {
  palette = loadPalette();
});

describe('single.njk — no matrix', () => {
  test('renders exactly 1 output', () => {
    const outputs = renderTemplate(fixture('single.njk'), palette);
    expect(outputs).toHaveLength(1);
  });

  test('output body contains neptune base hex #171919', () => {
    const [out] = renderTemplate(fixture('single.njk'), palette);
    expect(out.body).toContain('#171919');
  });

  test('output body contains neptune green hex #45dfa4', () => {
    const [out] = renderTemplate(fixture('single.njk'), palette);
    expect(out.body).toContain('#45dfa4');
  });

  test('output path resolves relative to fixture directory', () => {
    const [out] = renderTemplate(fixture('single.njk'), palette);
    expect(out.path).toBe(join(FIXTURES, 'out/single.txt'));
  });
});

describe('per-flavor.njk — matrix:[flavor]', () => {
  test('renders exactly 4 outputs', () => {
    const outputs = renderTemplate(fixture('per-flavor.njk'), palette);
    expect(outputs).toHaveLength(4);
  });

  test('output paths are named after each flavor identifier', () => {
    const outputs = renderTemplate(fixture('per-flavor.njk'), palette);
    const names = outputs.map((o) => o.path.split('/').pop());
    expect(names).toContain('neptune.txt');
    expect(names).toContain('mercury.txt');
    expect(names).toContain('mars.txt');
    expect(names).toContain('jupiter.txt');
  });

  test('neptune output contains base and green hex', () => {
    const outputs = renderTemplate(fixture('per-flavor.njk'), palette);
    const neptune = outputs.find((o) => o.path.endsWith('neptune.txt'))!;
    expect(neptune.body).toContain('#171919');
    expect(neptune.body).toContain('#45dfa4');
    // secondary = pink (L=0.870 per Catppuccin Mocha methodology)
    expect(neptune.body).toContain('#ffbfda');
  });

  test('--flavor neptune restricts to 1 output', () => {
    const outputs = renderTemplate(fixture('per-flavor.njk'), palette, { onlyFlavor: 'neptune' });
    expect(outputs).toHaveLength(1);
    expect(outputs[0].path).toContain('neptune.txt');
  });
});

describe('skip.njk — skip expression', () => {
  test('renders 3 outputs (mercury skipped)', () => {
    const outputs = renderTemplate(fixture('skip.njk'), palette);
    expect(outputs).toHaveLength(3);
  });

  test('mercury is not present in outputs', () => {
    const outputs = renderTemplate(fixture('skip.njk'), palette);
    const paths = outputs.map((o) => o.path);
    expect(paths.every((p) => !p.endsWith('mercury.txt'))).toBe(true);
  });

  test('all other flavors are present', () => {
    const outputs = renderTemplate(fixture('skip.njk'), palette);
    const paths = outputs.map((o) => o.path);
    expect(paths.some((p) => p.endsWith('mars.txt'))).toBe(true);
    expect(paths.some((p) => p.endsWith('jupiter.txt'))).toBe(true);
    expect(paths.some((p) => p.endsWith('neptune.txt'))).toBe(true);
  });
});

describe('undefined-var.njk — throwOnUndefined', () => {
  test('renderTemplate throws on undefined variable access', () => {
    expect(() => renderTemplate(fixture('undefined-var.njk'), palette)).toThrow();
  });

  test('renderParsed also throws when constructed directly', () => {
    const tpl = parseTemplate(fixture('undefined-var.njk'));
    expect(() => renderParsed(tpl, palette)).toThrow();
  });
});
