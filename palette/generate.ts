/**
 * Generate /shared/themes/palette/palette.json from OKLCH design knobs.
 *
 * The only place hex values for Startino's palette are decided. Re-running this
 * file is the only legitimate way palette.json changes — never hand-edit the
 * JSON. Determinism is part of the contract: byte-identical output across runs.
 */

import {
  clampChroma,
  converter,
  differenceCiede2000,
  formatHex,
  type Oklch,
} from 'culori';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

// === DESIGN KNOBS ==========================================================

export const FLAVORS = [
  // Neptune is the brand anchor — its base sits at OKLCH L=0.211, h=197
  // (the green tint of the original #171919). Chroma is now copied from
  // Catppuccin Mocha base (~0.030) so the green tint is visible, not just
  // present in math; the resulting hex is #061c1d (CIEDE2000-calibrated to
  // match Mocha base perceived saturation, since green at our hue reads
  // more vivid than Catppuccin's purple at identical OKLCH C — see the
  // NEUTRAL_TARGET_DE solver below). #061c1d replaces the previous
  // #171919 grey anchor. The other flavors mirror Catppuccin's lightness
  // progression (Latte/Frappé/Macchiato/Mocha) so the "feel" of switching
  // flavors matches a system most people already have a calibrated taste for.
  { id: 'mercury', name: 'Mercury', emoji: '☿', order: 0, baseL: 0.96,  isDark: false },
  { id: 'mars',    name: 'Mars',    emoji: '♂', order: 1, baseL: 0.33,  isDark: true  },
  { id: 'jupiter', name: 'Jupiter', emoji: '♃', order: 2, baseL: 0.27,  isDark: true  },
  { id: 'neptune', name: 'Neptune', emoji: '♆', order: 3, baseL: 0.211, isDark: true  },
] as const;

/**
 * Surface hue: the OKLCH hue of the original #171919 anchor — preserves
 * Startino's green tint across every neutral.
 */
const SURFACE_HUE = 197;

/**
 * Catppuccin's official neutrals — the source of truth for "how saturated
 * should each role feel?" Per-flavor mapping mirrors the L methodology
 * already used for accents:
 *
 *   mercury ← Catppuccin Latte
 *   mars    ← Catppuccin Frappé
 *   jupiter ← Catppuccin Macchiato
 *   neptune ← Catppuccin Mocha
 *
 * We do NOT copy these chromas verbatim into Startino. Reason: OKLCH
 * lightness is perceptually uniform but chroma at the same numeric value
 * renders more or less vivid depending on hue — green at h=197 reads more
 * saturated than purple at h=285 even at identical OKLCH C. Copying
 * Catppuccin's chromas at our hue would over-saturate the green tint.
 *
 * Instead we compute each role's CIEDE2000 ΔE from the achromatic point at
 * the same OKLCH L (see NEUTRAL_TARGET_DE below), then solve at build time
 * for the OKLCH chroma at SURFACE_HUE that produces the same ΔE at our
 * per-flavor L (see solveChromaForDE in buildFlavor). This gives true
 * perceptual parity across the hue rotation rather than mathematical parity.
 */
const CATPPUCCIN_NEUTRAL_HEXES = {
  latte:     { crust: '#dce0e8', mantle: '#e6e9ef', base: '#eff1f5', surface0: '#ccd0da', surface1: '#bcc0cc', surface2: '#acb0be', overlay0: '#9ca0b0', overlay1: '#8c8fa1', overlay2: '#7c7f93', subtext0: '#6c6f85', subtext1: '#5c5f77', text: '#4c4f69' },
  frappe:    { crust: '#232634', mantle: '#292c3c', base: '#303446', surface0: '#414559', surface1: '#51576d', surface2: '#626880', overlay0: '#737994', overlay1: '#838ba7', overlay2: '#949cbb', subtext0: '#a5adce', subtext1: '#b5bfe2', text: '#c6d0f5' },
  macchiato: { crust: '#181926', mantle: '#1e2030', base: '#24273a', surface0: '#363a4f', surface1: '#494d64', surface2: '#5b6078', overlay0: '#6e738d', overlay1: '#8087a2', overlay2: '#939ab7', subtext0: '#a5adcb', subtext1: '#b8c0e0', text: '#cad3f5' },
  mocha:     { crust: '#11111b', mantle: '#181825', base: '#1e1e2e', surface0: '#313244', surface1: '#45475a', surface2: '#585b70', overlay0: '#6c7086', overlay1: '#7f849c', overlay2: '#9399b2', subtext0: '#a6adc8', subtext1: '#bac2de', text: '#cdd6f4' },
} as const;

const FLAVOR_CPP_PAIR = {
  mercury: 'latte',
  mars:    'frappe',
  jupiter: 'macchiato',
  neptune: 'mocha',
} as const;

const dE2000 = differenceCiede2000();

/**
 * For each Catppuccin flavor × role, the CIEDE2000 ΔE between the official
 * Catppuccin hex and the achromatic point (C=0) at the same OKLCH L. This
 * is the perceptual chromatic distance Startino's neutrals must hit at
 * SURFACE_HUE to feel as saturated as Catppuccin's, no more.
 */
const NEUTRAL_TARGET_DE: Record<string, Record<string, number>> = (() => {
  const table: Record<string, Record<string, number>> = {};
  const oklch = converter('oklch');
  for (const cppFlavor of Object.keys(CATPPUCCIN_NEUTRAL_HEXES) as (keyof typeof CATPPUCCIN_NEUTRAL_HEXES)[]) {
    table[cppFlavor] = {};
    const hexes = CATPPUCCIN_NEUTRAL_HEXES[cppFlavor];
    for (const role of Object.keys(hexes) as (keyof typeof hexes)[]) {
      const cat = hexes[role];
      const o = oklch(cat)!;
      const achromaticHex = formatHex(clampChroma({ mode: 'oklch', l: o.l!, c: 0, h: 0 }, 'oklch', 'rgb'))!;
      table[cppFlavor][role] = dE2000(cat, achromaticHex);
    }
  }
  return table;
})();

/**
 * Find OKLCH chroma at (L, h) that puts the resulting color at exactly
 * targetDE perceptual units away from the achromatic point at the same L.
 * Binary search; clampChroma wraps each candidate so out-of-gamut requests
 * are physically realized at sRGB max — for very dark + green hues, this
 * means the achievable max ΔE may be slightly under target (real gamut
 * limit, not solver bug).
 */
function solveChromaForDE(L: number, h: number, targetDE: number): number {
  const achromaticHex = formatHex(clampChroma({ mode: 'oklch', l: L, c: 0, h }, 'oklch', 'rgb'))!;
  let lo = 0.0, hi = 0.10;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const candidateHex = formatHex(clampChroma({ mode: 'oklch', l: L, c: mid, h }, 'oklch', 'rgb'))!;
    const got = dE2000(achromaticHex, candidateHex);
    if (got < targetDE) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Lightness recipe for the 12 neutral roles.
 * - `delta`: fixed offset from base (used for crust/mantle which sit *below* base).
 * - `towardText`: weighted interpolation between base and the flavor's text endpoint.
 */
const NEUTRAL_RAMP = {
  crust:    { kind: 'delta',      v: -0.05  },
  mantle:   { kind: 'delta',      v: -0.025 },
  base:     { kind: 'delta',      v:  0     },
  surface0: { kind: 'towardText', v:  0.10  },
  surface1: { kind: 'towardText', v:  0.18  },
  surface2: { kind: 'towardText', v:  0.26  },
  overlay0: { kind: 'towardText', v:  0.36  },
  overlay1: { kind: 'towardText', v:  0.48  },
  overlay2: { kind: 'towardText', v:  0.60  },
  subtext0: { kind: 'towardText', v:  0.74  },
  subtext1: { kind: 'towardText', v:  0.86  },
  text:     { kind: 'towardText', v:  1.00  },
} as const;

const TEXT_L_DARK  = 0.92;
const TEXT_L_LIGHT = 0.30;

/**
 * The 14 accent hues in Catppuccin v1.8 emit order. Brand pair (`green`,
 * `pink`) carry an alias used by Startino-first templates as `{{ primary }}`
 * / `{{ secondary }}`.
 *
 * L values mirror Catppuccin's per-flavor-per-accent OKLCH L methodology:
 *   mercury ← Catppuccin Latte
 *   mars    ← Catppuccin Frappé
 *   jupiter ← Catppuccin Macchiato
 *   neptune ← Catppuccin Mocha (with green pinned at 0.809 for brand anchor)
 *
 * Hues (h) and chromas (c) are Startino's own tuned values — NOT copied
 * from Catppuccin. Only the L methodology is borrowed.
 *
 * IMPORTANT — Slot names are port-compatibility identifiers, not value
 * contracts. The `id` of each row matches Catppuccin's slot names so
 * downstream port templates (kitty, tmux, waybar, …) reference them by the
 * same name a Catppuccin port author expects. The hex each slot emits is
 * defined HERE and may deliberately diverge from Catppuccin's hex for the
 * same name — for example, `mauve` may emit pink's hex, and `blue` may emit
 * brand-teal's hex, to surface Startino's two-color brand pair more often.
 * See `docs/style-guide.md` §7 for the rule. Do not "correct" a slot back
 * toward its Catppuccin hex without checking the style guide first.
 */
export const ACCENTS = [
  { id: 'rosewater', h: 20,  c: 0.06,
    L: { mercury: 0.714, mars: 0.895, jupiter: 0.911, neptune: 0.923 } },
  { id: 'flamingo',  h: 18,  c: 0.10,
    L: { mercury: 0.686, mars: 0.844, jupiter: 0.863, neptune: 0.880 } },
  { id: 'pink',      h: 352, c: 0.22, alias: 'secondary' as const, // #ff4fad lifted
    L: { mercury: 0.726, mars: 0.850, jupiter: 0.861, neptune: 0.870 } },
  // Mauve collapses to pink: same h/c/L as the pink row, so mauve's hex is
  // byte-identical to pink's per flavor. Catppuccin modules referencing
  // @thm_mauve render as Startino's secondary brand color. See style guide §7.
  { id: 'mauve',     h: 352, c: 0.22,
    L: { mercury: 0.726, mars: 0.850, jupiter: 0.861, neptune: 0.870 } },
  { id: 'red',       h: 12,  c: 0.18,
    L: { mercury: 0.550, mars: 0.717, jupiter: 0.737, neptune: 0.756 } },
  { id: 'maroon',    h: 0,   c: 0.12,
    L: { mercury: 0.625, mars: 0.765, jupiter: 0.770, neptune: 0.782 } },
  { id: 'peach',     h: 50,  c: 0.14,
    L: { mercury: 0.692, mars: 0.773, jupiter: 0.799, neptune: 0.824 } },
  { id: 'yellow',    h: 90,  c: 0.13,
    L: { mercury: 0.714, mars: 0.844, jupiter: 0.879, neptune: 0.919 } },
  { id: 'green',     h: 163, c: 0.154, alias: 'primary' as const, // = #45dfa4 brand
    L: { mercury: 0.625, mars: 0.812, jupiter: 0.835, neptune: 0.809 } }, // neptune pinned for brand
  // Teal shifted from h=195 to h=205 so it reads as clearly distinct from
  // blue (now at h=182, brand-teal-anchored) — avoids two near-identical teals.
  { id: 'teal',      h: 205, c: 0.10,
    L: { mercury: 0.602, mars: 0.783, jupiter: 0.821, neptune: 0.858 } },
  { id: 'sky',       h: 215, c: 0.10,
    L: { mercury: 0.682, mars: 0.826, jupiter: 0.837, neptune: 0.847 } },
  { id: 'sapphire',  h: 235, c: 0.12,
    L: { mercury: 0.648, mars: 0.780, jupiter: 0.785, neptune: 0.791 } },
  // Blue anchored at Startino brand teal #3cddc8 — h=182 (sits 19° from green
  // h=163), c=0.133. Neptune L pinned at 0.812 so the rendered hex matches the
  // brand color exactly. Catppuccin modules referencing @thm_blue render as
  // Startino's brand teal. See style guide §7.
  { id: 'blue',      h: 182, c: 0.133,
    L: { mercury: 0.559, mars: 0.742, jupiter: 0.750, neptune: 0.812 } },
  // Lavender shifted from h=280 (purple) to h=150 (sage / soft green) at lower
  // chroma — joins the green family as a desaturated companion to brand mint
  // (which sits at h=163, c=0.154). See style guide §7.
  { id: 'lavender',  h: 150, c: 0.07,
    L: { mercury: 0.664, mars: 0.810, jupiter: 0.814, neptune: 0.817 } },
] as const;

/**
 * ANSI 16-color mapping. Code 0-7 = normal, 8-15 = bright.
 * Normals pick the closest brand-named accent; brights pick a neighbouring hue
 * to give a visible distinction. Black/white tap surface and subtext tiers.
 */
const ANSI_MAP = [
  { name: 'black',   code: 0, normal: 'surface1', bright: 'surface2' },
  { name: 'red',     code: 1, normal: 'red',      bright: 'maroon'   },
  { name: 'green',   code: 2, normal: 'green',    bright: 'teal'     },
  { name: 'yellow',  code: 3, normal: 'yellow',   bright: 'peach'    },
  { name: 'blue',    code: 4, normal: 'blue',     bright: 'sapphire' },
  { name: 'magenta', code: 5, normal: 'pink',     bright: 'mauve'    },
  { name: 'cyan',    code: 6, normal: 'teal',     bright: 'sky'      },
  { name: 'white',   code: 7, normal: 'subtext1', bright: 'subtext0' },
] as const;

// === EMISSION ORDER ========================================================

const ACCENT_ORDER = ACCENTS.map((a) => a.id);
const NEUTRAL_ORDER = [
  'text', 'subtext1', 'subtext0',
  'overlay2', 'overlay1', 'overlay0',
  'surface2', 'surface1', 'surface0',
  'base', 'mantle', 'crust',
] as const;
const COLOR_ORDER = [...ACCENT_ORDER, ...NEUTRAL_ORDER] as const;

// === TYPES =================================================================

type ColorEntry = {
  name: string;
  order: number;
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  oklch: { l: number; c: number; h: number };
  accent: boolean;
  alias?: 'primary' | 'secondary';
};

type AnsiSubColor = {
  name: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  code: number;
};

type AnsiEntry = {
  name: string;
  order: number;
  normal: AnsiSubColor;
  bright: AnsiSubColor;
};

type Flavor = {
  name: string;
  emoji: string;
  order: number;
  dark: boolean;
  colors: Record<string, ColorEntry>;
  ansiColors: Record<string, AnsiEntry>;
};

// === HELPERS ===============================================================

const toRgb = converter('rgb');
const toHsl = converter('hsl');

const round = (n: number, places: number) => {
  const p = 10 ** places;
  return Math.round(n * p) / p;
};

const titleCase = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1).replace(/(\d+)/, ' $1').trimEnd();

/** Build one color entry by clamping its requested OKLCH into sRGB gamut. */
function buildColor(args: {
  id: string;
  name: string;
  order: number;
  l: number;
  c: number;
  h: number;
  accent: boolean;
  alias?: 'primary' | 'secondary';
}): ColorEntry {
  const requested: Oklch = { mode: 'oklch', l: args.l, c: args.c, h: args.h };
  const clamped = clampChroma(requested, 'oklch', 'rgb') as Oklch;
  const hex = formatHex(clamped)!;
  const rgb = toRgb(clamped)!;
  const hsl = toHsl(rgb)!;
  return {
    name: args.name,
    order: args.order,
    hex,
    rgb: {
      r: Math.round((rgb.r ?? 0) * 255),
      g: Math.round((rgb.g ?? 0) * 255),
      b: Math.round((rgb.b ?? 0) * 255),
    },
    hsl: {
      h: round(hsl.h ?? 0, 0),
      s: round((hsl.s ?? 0) * 100, 0),
      l: round((hsl.l ?? 0) * 100, 0),
    },
    oklch: {
      l: round(clamped.l ?? 0, 3),
      c: round(clamped.c ?? 0, 3),
      h: round(clamped.h ?? 0, 0),
    },
    accent: args.accent,
    ...(args.alias ? { alias: args.alias } : {}),
  };
}

function buildAnsiSub(srcColor: ColorEntry, targetName: string, code: number): AnsiSubColor {
  return {
    name: targetName,
    hex: srcColor.hex,
    rgb: { ...srcColor.rgb },
    hsl: { ...srcColor.hsl },
    code,
  };
}

// === BUILD ONE FLAVOR ======================================================

function buildFlavor(spec: typeof FLAVORS[number]): Flavor {
  const textL = spec.isDark ? TEXT_L_DARK : TEXT_L_LIGHT;

  // Build all colors keyed by id. Emit order is applied at serialize time.
  const colors: Record<string, ColorEntry> = {};

  // Accents — each uses its own per-flavor L from the Catppuccin-mirrored map
  ACCENTS.forEach((a, i) => {
    const accentL = a.L[spec.id as keyof typeof a.L];
    colors[a.id] = buildColor({
      id: a.id,
      name: titleCase(a.id),
      order: i,
      l: accentL,
      c: a.c,
      h: a.h,
      accent: true,
      alias: 'alias' in a ? a.alias : undefined,
    });
  });

  // Neutrals — L from Startino's per-flavor formula; chroma solved per-role
  // to match the paired Catppuccin flavor's CIEDE2000 ΔE-from-achromatic
  // (see NEUTRAL_TARGET_DE); hue pinned to SURFACE_HUE so every neutral
  // inherits the green tint. Perceptual parity, not numeric parity — green
  // at h=197 gets less OKLCH chroma than purple at h=285 to feel equally
  // saturated.
  const cppFlavor = FLAVOR_CPP_PAIR[spec.id as keyof typeof FLAVOR_CPP_PAIR];
  NEUTRAL_ORDER.forEach((role, i) => {
    const ramp = NEUTRAL_RAMP[role as keyof typeof NEUTRAL_RAMP];
    const L = ramp.kind === 'delta'
      ? spec.baseL + ramp.v
      : spec.baseL + (textL - spec.baseL) * ramp.v;
    const targetDE = NEUTRAL_TARGET_DE[cppFlavor][role];
    const C = solveChromaForDE(L, SURFACE_HUE, targetDE);
    colors[role] = buildColor({
      id: role,
      name: titleCase(role),
      order: ACCENTS.length + i,
      l: L,
      c: C,
      h: SURFACE_HUE,
      accent: false,
    });
  });

  // ANSI
  const ansiColors: Record<string, AnsiEntry> = {};
  ANSI_MAP.forEach((m, i) => {
    ansiColors[m.name] = {
      name: titleCase(m.name),
      order: i,
      normal: buildAnsiSub(colors[m.normal], colors[m.normal].name, m.code),
      bright: buildAnsiSub(colors[m.bright], colors[m.bright].name, m.code + 8),
    };
  });

  return {
    name: spec.name,
    emoji: spec.emoji,
    order: spec.order,
    dark: spec.isDark,
    colors: orderColors(colors),
    ansiColors,
  };
}

/** Re-key colors object in canonical emit order (accents → neutrals). */
function orderColors(colors: Record<string, ColorEntry>): Record<string, ColorEntry> {
  const out: Record<string, ColorEntry> = {};
  for (const id of COLOR_ORDER) out[id] = colors[id];
  return out;
}

// === BUILD WHOLE PALETTE ===================================================

export function buildPalette() {
  const out: Record<string, unknown> = {
    $schema: './palette.schema.json',
    version: '0.1.0',
  };
  for (const spec of FLAVORS) {
    out[spec.id] = buildFlavor(spec);
  }
  return out;
}

/** Diagnostic: report where requested OKLCH was nudged to fit sRGB. */
function reportClampDeltas(palette: Record<string, unknown>): string[] {
  const lines: string[] = [];
  const targets: Array<{ flavor: string; id: string; targetHex?: string }> = [
    { flavor: 'neptune', id: 'green',  targetHex: '#45dfa4' },
    { flavor: 'neptune', id: 'base',   targetHex: '#061c1d' }, // green-tinted dark anchor — ΔE2000-calibrated to match Mocha base perceived saturation
    { flavor: 'neptune', id: 'blue',   targetHex: '#3cddc8' }, // brand teal anchor
  ];
  for (const t of targets) {
    const flavor = palette[t.flavor] as Flavor;
    const c = flavor.colors[t.id];
    if (!t.targetHex) continue;
    const dE = differenceCiede2000()(c.hex, t.targetHex);
    lines.push(`  ${t.flavor}.${t.id} → ${c.hex}  (target ${t.targetHex}, ΔE=${round(dE, 3)})`);
  }
  return lines;
}

// === MAIN ==================================================================

if (import.meta.main) {
  const palette = buildPalette();
  const json = JSON.stringify(palette, null, 2) + '\n';
  const outPath = join(import.meta.dir, 'palette.json');
  writeFileSync(outPath, json);
  console.log(`✓ wrote ${outPath} (${json.length.toLocaleString()} bytes)`);
  console.log(`Anchor checks:`);
  for (const line of reportClampDeltas(palette)) console.log(line);
}
