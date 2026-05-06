/**
 * Frontmatter parsing and Nunjucks environment setup.
 */

import grayMatter from 'gray-matter';
import nunjucks from 'nunjucks';
import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { registerFilters } from './filters.ts';
import type { Frontmatter } from './types.ts';

export type ParsedTemplate = {
  /** absolute path of the template */
  path: string;
  frontmatter: Frontmatter;
  /** template body (everything after the closing `---`) */
  body: string;
};

const FRONTMATTER_OPTIONS = {
  delimiters: ['---', '---'],
} as const;

export function parseTemplate(templatePath: string): ParsedTemplate {
  const raw = readFileSync(templatePath, 'utf8');
  const parsed = grayMatter(raw, FRONTMATTER_OPTIONS as any);
  const fm = (parsed.data ?? {}) as Frontmatter;
  if (typeof fm.filename !== 'string' || fm.filename.length === 0) {
    throw new Error(
      `${templatePath}: frontmatter must declare a "filename" field (template expression).`,
    );
  }
  return {
    path: templatePath,
    frontmatter: fm,
    body: parsed.content,
  };
}

/**
 * Build a Nunjucks environment scoped to the template's directory so
 * `{% include %}` and `{% extends %}` resolve relative to the template.
 */
export function makeEnv(templatePath: string): nunjucks.Environment {
  const loader = new nunjucks.FileSystemLoader(dirname(templatePath), {
    noCache: true,
  });
  const env = new nunjucks.Environment(loader, {
    autoescape: false,        // we are emitting code, not HTML
    throwOnUndefined: true,   // catch typos like `{{ flavor.colorz.green }}`
    trimBlocks: true,
    lstripBlocks: true,
  });
  registerFilters(env);
  return env;
}
