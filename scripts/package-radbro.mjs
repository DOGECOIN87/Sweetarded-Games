import { cp, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const game = process.argv[2];
if (game !== 'slots' && game !== 'coinpusher') {
  throw new Error('Usage: node scripts/package-radbro.mjs <slots|coinpusher>');
}

const root = process.cwd();
const source = path.join(root, 'public');
const destination = path.join(root, 'dist-radbro', game);

const common = ['fonts', 'games-bg.png', 'logos', 'sweetardios-logo.svg', 'fawwwwwwwk.mp3'];
const assets = game === 'slots'
  ? [...common, 'symbols']
  : [...common, 'assets', 'mascot.png'];

await mkdir(destination, { recursive: true });
for (const asset of assets) {
  await cp(path.join(source, asset), path.join(destination, asset), { recursive: true });
}

const limits = { files: 500, unpackedBytes: 100 * 1024 * 1024 };

async function measure(directory) {
  const { readdir } = await import('node:fs/promises');
  let files = 0;
  let bytes = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const child = await measure(entryPath);
      files += child.files;
      bytes += child.bytes;
    } else if (entry.isFile()) {
      files += 1;
      bytes += (await stat(entryPath)).size;
    }
  }
  return { files, bytes };
}

const measured = await measure(destination);
if (measured.files > limits.files || measured.bytes > limits.unpackedBytes) {
  throw new Error(`Radbro package exceeds limits: ${measured.files} files, ${measured.bytes} bytes`);
}

console.log(`${game}: ${measured.files} files, ${(measured.bytes / 1024 / 1024).toFixed(2)} MB unpacked`);
