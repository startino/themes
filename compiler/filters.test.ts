/**
 * Unit tests for compiler/filters.ts
 * Uses loadPalette() so tests stay in sync with the real palette data.
 */

import { describe, test, expect, beforeAll } from 'bun:test';
import nunjucks from 'nunjucks';
import { registerFilters } from './filters.ts';
import { loadPalette } from './palette-loader.ts';
import type { Palette } from './types.ts';

let palette: Palette;
let env: nunjucks.Environment;

// Neptune green: hex=#45dfa4, rgb={r:69,g:223,b:164}, hsl={h:157,s:71,l:57}, oklch={l:0.809,c:0.154,h:163}
const neptune = () => palette.flavorsById['neptune'];
const green = () => neptune().colors.green;

function render(filter: string): string {
  return env.renderString(`{{ color | ${filter} }}`, { color: green() });
}

beforeAll(() => {
  palette = loadPalette();
  env = new nunjucks.Environment(null as any, { autoescape: false, throwOnUndefined: true });
  registerFilters(env);
});

describe('hex filters', () => {
  test('hex returns full hex with hash', () => {
    expect(render('hex')).toBe('#45dfa4');
  });

  test('hex_no_hash strips the hash', () => {
    expect(render('hex_no_hash')).toBe('45dfa4');
  });
});

describe('rgb filters', () => {
  test('rgb produces comma-separated legacy CSS', () => {
    expect(render('rgb')).toBe('rgb(69, 223, 164)');
  });

  test('css_rgb produces space-separated modern CSS', () => {
    expect(render('css_rgb')).toBe('rgb(69 223 164)');
  });

  test('rgb_tuple produces raw space-separated channels', () => {
    expect(render('rgb_tuple')).toBe('69 223 164');
  });

  test('rgb_comma produces comma-separated channels without wrapper', () => {
    expect(render('rgb_comma')).toBe('69, 223, 164');
  });
});

describe('hsl filters', () => {
  test('hsl produces comma-separated with percent', () => {
    expect(render('hsl')).toBe('hsl(157, 71%, 57%)');
  });

  test('css_hsl produces space-separated with percent', () => {
    expect(render('css_hsl')).toBe('hsl(157 71% 57%)');
  });

  test('hsl_tuple produces raw space-separated h s% l%', () => {
    expect(render('hsl_tuple')).toBe('157 71% 57%');
  });
});

describe('oklch filters', () => {
  test('css_oklch produces oklch(L C H)', () => {
    const g = green();
    expect(render('css_oklch')).toBe(`oklch(${g.oklch.l} ${g.oklch.c} ${g.oklch.h})`);
  });

  test('oklch_tuple produces raw L C H', () => {
    const g = green();
    expect(render('oklch_tuple')).toBe(`${g.oklch.l} ${g.oklch.c} ${g.oklch.h}`);
  });
});

describe('channel accessor filters', () => {
  test('r returns red channel integer', () => {
    expect(render('r')).toBe('69');
  });

  test('g returns green channel integer', () => {
    expect(render('g')).toBe('223');
  });

  test('b returns blue channel integer', () => {
    expect(render('b')).toBe('164');
  });
});

describe('string filters', () => {
  test('upper_first capitalizes first character', () => {
    const result = env.renderString('{{ s | upper_first }}', { s: 'neptune' });
    expect(result).toBe('Neptune');
  });

  test('upper_first handles empty string', () => {
    const result = env.renderString('{{ s | upper_first }}', { s: '' });
    expect(result).toBe('');
  });
});

describe('lift behavior — non-color passthrough', () => {
  test('passing a string through hex returns the string unchanged', () => {
    const result = env.renderString('{{ val | hex }}', { val: 'not-a-color' });
    expect(result).toBe('not-a-color');
  });

  test('passing a plain object (no color fields) through rgb returns the object unchanged', () => {
    // lift returns the value unmodified when it is not a ColorEntry;
    // Nunjucks stringifies the object with [object Object] — the point is it does not throw.
    const plainObj = { foo: 'bar' };
    const result = env.renderString('{{ val | rgb }}', { val: plainObj });
    expect(result).toBe('[object Object]');
  });

  test('passing a number through css_hsl returns the number unchanged', () => {
    const result = env.renderString('{{ val | css_hsl }}', { val: 42 });
    expect(result).toBe('42');
  });
});
