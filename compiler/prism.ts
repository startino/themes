#!/usr/bin/env bun
/**
 * prism — Startino Themes compiler.
 *
 * Modes:
 *   prism <template.njk>          render the template's matrix to disk
 *   prism --port <name>           render every template under ports/<name>/
 *   prism --all                   render every template under ports/
 *   prism <...> --flavor <id>     restrict matrix to one flavor
 *   prism <...> --check           don't write; diff against committed files
 *
 * Exit codes:
 *   0  success (or --check found no drift)
 *   1  drift detected, render error, or invalid usage
 */

import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import pc from 'picocolors';
import { createPatch } from 'diff';
import { loadPalette } from './palette-loader.ts';
import { renderTemplate, type RenderOptions } from './render.ts';
import type { RenderOutput } from './types.ts';

const REPO_ROOT = resolve(import.meta.dir, '..');
const PORTS_DIR = join(REPO_ROOT, 'ports');

type Mode = 'render' | 'check';

function parseCliArgs() {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      port:    { type: 'string' },
      all:     { type: 'boolean' },
      flavor:  { type: 'string' },
      check:   { type: 'boolean' },
      help:    { type: 'boolean', short: 'h' },
    },
    allowPositionals: true,
    strict: true,
  });
  return { values, positionals };
}

function printUsageAndExit(code = 0): never {
  console.log(`prism — Startino Themes compiler

Usage:
  prism <template.njk>             render one template
  prism --port <name>              render all templates in ports/<name>/
  prism --all                      render every port

Options:
  --flavor <id>                    only render this flavor (mercury|mars|jupiter|neptune)
  --check                          do not write; diff against committed dist files
  -h, --help                       show this help
`);
  process.exit(code);
}

/**
 * Walk a directory and return every file ending in .njk.
 */
function findTemplates(dir: string): string[] {
  const out: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      const st = statSync(full);
      if (st.isDirectory()) walk(full);
      else if (entry.endsWith('.njk')) out.push(full);
    }
  };
  walk(dir);
  return out.sort();
}

function readExistingOrEmpty(path: string): string | null {
  try {
    return readFileSync(path, 'utf8');
  } catch (e: any) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

function writeFile(path: string, body: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
}

type Stats = { wrote: number; unchanged: number; drifted: number; errors: number };

function summarize(stats: Stats, mode: Mode) {
  const parts: string[] = [];
  if (mode === 'render') {
    if (stats.wrote)     parts.push(pc.green(`${stats.wrote} written`));
    if (stats.unchanged) parts.push(pc.dim(`${stats.unchanged} unchanged`));
  } else {
    if (stats.unchanged) parts.push(pc.green(`${stats.unchanged} in sync`));
    if (stats.drifted)   parts.push(pc.red(`${stats.drifted} drifted`));
  }
  if (stats.errors) parts.push(pc.red(`${stats.errors} errors`));
  console.log(parts.join('   '));
}

async function processTemplate(
  templatePath: string,
  options: RenderOptions,
  mode: Mode,
  stats: Stats,
): Promise<void> {
  const palette = loadPalette();
  let outputs: RenderOutput[];
  try {
    outputs = renderTemplate(templatePath, palette, options);
  } catch (err) {
    stats.errors++;
    console.error(pc.red(`✗ ${relative(REPO_ROOT, templatePath)}`));
    console.error(`  ${(err as Error).message}`);
    return;
  }

  for (const out of outputs) {
    const rel = relative(REPO_ROOT, out.path);
    const existing = readExistingOrEmpty(out.path);
    const inSync = existing === out.body;

    if (mode === 'render') {
      if (inSync) {
        stats.unchanged++;
        console.log(pc.dim(`= ${rel}`));
      } else {
        writeFile(out.path, out.body);
        stats.wrote++;
        const sizeKb = (Buffer.byteLength(out.body) / 1024).toFixed(1);
        console.log(pc.green(`+ ${rel}`) + pc.dim(`  (${sizeKb} KB)`));
      }
    } else {
      // check
      if (existing === null) {
        stats.drifted++;
        console.log(pc.red(`✗ ${rel}`) + pc.dim(`  (file missing)`));
      } else if (!inSync) {
        stats.drifted++;
        console.log(pc.red(`✗ ${rel}`));
        const patch = createPatch(rel, existing, out.body, 'committed', 'expected');
        console.log(pc.dim(patch.split('\n').slice(2, 22).join('\n')));
      } else {
        stats.unchanged++;
        console.log(pc.dim(`= ${rel}`));
      }
    }
  }
}

async function main() {
  const { values, positionals } = parseCliArgs();

  if (values.help) printUsageAndExit(0);

  const mode: Mode = values.check ? 'check' : 'render';
  const renderOpts: RenderOptions = {};
  if (values.flavor) renderOpts.onlyFlavor = values.flavor;

  let templates: string[];

  if (values.all) {
    templates = findTemplates(PORTS_DIR);
  } else if (values.port) {
    const portDir = join(PORTS_DIR, values.port);
    if (!statSync(portDir, { throwIfNoEntry: false })?.isDirectory()) {
      console.error(pc.red(`✗ no port directory at ${portDir}`));
      process.exit(1);
    }
    templates = findTemplates(portDir);
  } else if (positionals.length > 0) {
    templates = positionals.map((p) => resolve(p));
  } else {
    printUsageAndExit(1);
  }

  if (templates.length === 0) {
    console.log(pc.yellow('no templates found'));
    process.exit(0);
  }

  const stats: Stats = { wrote: 0, unchanged: 0, drifted: 0, errors: 0 };
  for (const tpl of templates) {
    await processTemplate(tpl, renderOpts, mode, stats);
  }

  summarize(stats, mode);

  const fail = stats.errors > 0 || (mode === 'check' && stats.drifted > 0);
  process.exit(fail ? 1 : 0);
}

main().catch((err) => {
  console.error(pc.red('unhandled error:'));
  console.error(err);
  process.exit(1);
});
