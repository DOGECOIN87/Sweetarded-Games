/**
 * Builds the original Sweetardio site (the arcade that After Hours Rx replaced)
 * from its last commit into dist/original/, where vending keypad code 6969
 * opens it.
 *
 * The old source is taken without its public/ folder. Every public file the
 * old site loads by root path (/audio, /art, /fonts, /logos, ...) is still
 * shipped, byte for byte, by the current site at the root, and leaving public/
 * out keeps Vite from re-pointing those paths under /original/. So only the
 * old page and its compiled assets are added.
 *
 * scripts/original-site.patch is applied on top: the site now announces that
 * the mint is live and points its banner at /mint. The old mint countdown is
 * built against its own default date (already past), never VITE_MINT_START_AT,
 * so every status spot shows the live announcement instead of a countdown.
 *
 * Run after `npm run build`: npm run build:original
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

/** The last commit before "Rebuild sweetardio.fun as After Hours Rx / Counter 4444". */
const COMMIT = '4bcc24d15c5d52aeaea0ec0739049cfaa43ea514';
const BASE = '/original/';

const root = process.cwd();
const patch = path.join(root, 'scripts', 'original-site.patch');
const patchId = createHash('sha256').update(readFileSync(patch)).digest('hex').slice(0, 10);
const work = path.join(root, 'node_modules', '.cache', 'original-site');
// A changed patch gets a fresh copy of the source.
const source = path.join(work, `${COMMIT.slice(0, 12)}-${patchId}`);
const built = path.join(work, 'dist');
const destination = path.join(root, 'dist', 'original');

const run = (command, args, cwd = root, env = process.env) => execFileSync(command, args, { cwd, env, stdio: 'inherit' });

if (!existsSync(path.join(root, 'dist', 'index.html'))) {
  throw new Error('Build the current site first: npm run build');
}

// A shallow CI checkout doesn't have the old commit; fetch just that one.
try {
  execFileSync('git', ['cat-file', '-e', `${COMMIT}^{commit}`], { cwd: root, stdio: 'ignore' });
} catch {
  run('git', ['fetch', '--no-tags', '--depth=1', 'origin', COMMIT]);
}

if (!existsSync(path.join(source, 'package.json'))) {
  await rm(source, { recursive: true, force: true });
  await mkdir(source, { recursive: true });
  const archive = path.join(work, 'source.tar');
  run('git', ['archive', '--format=tar', `--output=${archive}`, COMMIT, '--', '.', ':(exclude)public']);
  run('tar', ['-xf', archive, '-C', source]);
  await rm(archive);
  run('patch', ['-p1', '--forward', '--batch', '-i', patch], source);
}
if (!existsSync(path.join(source, 'node_modules'))) {
  run('npm', ['ci', '--no-audit', '--no-fund'], source);
}

run(
  process.execPath,
  [path.join(source, 'node_modules', 'vite', 'bin', 'vite.js'), 'build', `--base=${BASE}`, `--outDir=${built}`, '--emptyOutDir'],
  source,
  { ...process.env, VITE_MINT_START_AT: '' },
);

// The current site is the canonical one; keep search engines off the archive.
const page = path.join(built, 'index.html');
const html = await readFile(page, 'utf8');
if (!html.includes('</head>')) throw new Error('Unexpected original index.html: no </head>');
await writeFile(page, html.replace('</head>', '  <meta name="robots" content="noindex" />\n</head>'));

await rm(destination, { recursive: true, force: true });
await cp(built, destination, { recursive: true });
if (!existsSync(path.join(destination, 'index.html'))) throw new Error('dist/original/index.html is missing');
console.log(`Original site built from ${COMMIT.slice(0, 7)} into dist/original/`);
