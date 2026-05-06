/**
 * Types for the palette artefact and template frontmatter.
 * Shared by every compiler module.
 */

export type ColorEntry = {
  name: string;
  order: number;
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  oklch: { l: number; c: number; h: number };
  accent: boolean;
  alias?: 'primary' | 'secondary';
};

export type AnsiSubColor = {
  name: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  code: number;
};

export type AnsiEntry = {
  name: string;
  order: number;
  normal: AnsiSubColor;
  bright: AnsiSubColor;
};

export type Flavor = {
  /** stable lowercase id ("neptune", "mars", ...) */
  identifier: string;
  name: string;
  emoji: string;
  order: number;
  dark: boolean;
  /** convenience inverse of `dark` */
  light: boolean;
  colors: Record<string, ColorEntry>;
  ansiColors: Record<string, AnsiEntry>;
};

export type Palette = {
  version: string;
  flavors: Flavor[];
  /** by-identifier lookup */
  flavorsById: Record<string, Flavor>;
};

export type FrontmatterAxis = 'flavor' | 'accent' | string;

export type Frontmatter = {
  /** semver constraint on compiler — advisory for v0.1 */
  prism?: { version?: string };
  /** template expression, evaluated per matrix combination */
  filename: string;
  /** axes to iterate. Empty array = single render with no per-iteration variable */
  matrix?: FrontmatterAxis[];
  /** truthy skip expression evaluated per combination */
  skip?: string;
  /** custom axes; arrays declared at top level become iterables */
  [key: string]: unknown;
};

export type RenderContext = {
  flavor?: Flavor;
  /** all flavors, ordered by `.order` */
  flavors: Flavor[];
  /** by-identifier lookup */
  flavorsById: Record<string, Flavor>;
  /** when matrix includes `accent`, the current accent identifier */
  accent?: string;
  /** when matrix includes `accent`, the resolved color in the current flavor */
  accentColor?: ColorEntry;
  /** brand aliases for the current flavor (only set when flavor is in scope) */
  primary?: ColorEntry;
  secondary?: ColorEntry;
  /** direct color access (e.g. `{{ green.hex }}`) — current flavor's colors flattened */
  [colorName: string]: unknown;
};

export type RenderOutput = {
  /** absolute path the file was/would be written to */
  path: string;
  /** rendered file contents */
  body: string;
  /** matrix combination that produced this file (debug) */
  combination: Record<string, unknown>;
};
