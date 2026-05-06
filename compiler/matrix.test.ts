/**
 * Unit tests for compiler/matrix.ts
 */

import { describe, test, expect, beforeAll } from 'bun:test';
import { expandMatrix } from './matrix.ts';
import { loadPalette, ACCENT_IDS } from './palette-loader.ts';
import type { Palette, Frontmatter } from './types.ts';

let palette: Palette;

beforeAll(() => {
  palette = loadPalette();
});

function fm(overrides: Partial<Frontmatter>): Frontmatter {
  return { filename: 'out/test.txt', ...overrides };
}

describe('empty matrix', () => {
  test('matrix: [] returns exactly one combination that is empty', () => {
    const result = expandMatrix(fm({ matrix: [] }), palette);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({});
  });

  test('undefined matrix also returns one empty combination', () => {
    const result = expandMatrix(fm({}), palette);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({});
  });
});

describe('flavor axis', () => {
  test('matrix: [flavor] returns 4 combinations', () => {
    const result = expandMatrix(fm({ matrix: ['flavor'] }), palette);
    expect(result).toHaveLength(4);
  });

  test('combinations are sorted by flavor.order', () => {
    const result = expandMatrix(fm({ matrix: ['flavor'] }), palette);
    const orders = result.map((c) => (c.flavor as any).order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  test('each combination carries the flavor object', () => {
    const result = expandMatrix(fm({ matrix: ['flavor'] }), palette);
    const ids = result.map((c) => (c.flavor as any).identifier);
    expect(ids).toContain('neptune');
    expect(ids).toContain('mercury');
    expect(ids).toContain('mars');
    expect(ids).toContain('jupiter');
  });
});

describe('accent axis', () => {
  test('matrix: [accent] returns 14 combinations', () => {
    const result = expandMatrix(fm({ matrix: ['accent'] }), palette);
    expect(result).toHaveLength(14);
  });

  test('all accent ids are represented', () => {
    const result = expandMatrix(fm({ matrix: ['accent'] }), palette);
    const ids = result.map((c) => c.accent as string);
    for (const id of ACCENT_IDS) {
      expect(ids).toContain(id);
    }
  });
});

describe('flavor × accent cartesian product', () => {
  test('matrix: [flavor, accent] returns 56 combinations', () => {
    const result = expandMatrix(fm({ matrix: ['flavor', 'accent'] }), palette);
    expect(result).toHaveLength(56); // 4 × 14
  });

  test('every combination has both flavor and accent keys', () => {
    const result = expandMatrix(fm({ matrix: ['flavor', 'accent'] }), palette);
    for (const combo of result) {
      expect(combo).toHaveProperty('flavor');
      expect(combo).toHaveProperty('accent');
    }
  });
});

describe('onlyFlavor option', () => {
  test('onlyFlavor: neptune restricts flavor axis to 1 combination', () => {
    const result = expandMatrix(fm({ matrix: ['flavor'] }), palette, { onlyFlavor: 'neptune' });
    expect(result).toHaveLength(1);
    expect((result[0].flavor as any).identifier).toBe('neptune');
  });

  test('onlyFlavor with accent axis yields 14 combinations', () => {
    const result = expandMatrix(fm({ matrix: ['flavor', 'accent'] }), palette, { onlyFlavor: 'neptune' });
    expect(result).toHaveLength(14);
    for (const combo of result) {
      expect((combo.flavor as any).identifier).toBe('neptune');
    }
  });

  test('onlyFlavor with unknown id throws', () => {
    expect(() =>
      expandMatrix(fm({ matrix: ['flavor'] }), palette, { onlyFlavor: 'invalid' })
    ).toThrow('Unknown flavor: invalid');
  });
});

describe('unknown axis', () => {
  test('unknown axis name without frontmatter array throws', () => {
    expect(() =>
      expandMatrix(fm({ matrix: ['bogusAxis'] }), palette)
    ).toThrow(/Unknown matrix axis "bogusAxis"/);
  });
});

describe('custom array axis', () => {
  test('custom array axis expands to the declared values', () => {
    const template = fm({
      matrix: ['mode'],
      mode: ['light', 'dark'],
    });
    const result = expandMatrix(template, palette);
    expect(result).toHaveLength(2);
    expect(result[0].mode).toBe('light');
    expect(result[1].mode).toBe('dark');
  });

  test('custom axis × flavor produces cartesian product', () => {
    const template = fm({
      matrix: ['flavor', 'mode'],
      mode: ['light', 'dark'],
    });
    const result = expandMatrix(template, palette);
    expect(result).toHaveLength(8); // 4 × 2
  });
});
