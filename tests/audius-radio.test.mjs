import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
// Exercise the production API code with deterministic provider responses.
const source = readFileSync(new URL('../src/rx/audiusStation.ts', import.meta.url), 'utf8')
  .replace('import.meta.env', '{}');
const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { fetchStation, withApp } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const originalFetch = globalThis.fetch;
try {
  const requests = [];
  globalThis.fetch = async url => {
    requests.push(url);
    if (url === 'https://api.audius.co') return { ok: true, json: async () => ({ data: ['https://untrusted.example', 'https://node.audius.co'] }) };
    if (url.startsWith('https://node.audius.co')) return { ok: false };
    return { ok: true, json: async () => ({ data: [
      { id: 'gated', title: 'Locked', is_stream_gated: true },
      { id: 'premium', title: 'Paid', is_premium: true },
      { id: 'blocked', title: 'Unavailable', is_streamable: false },
      { id: 'free', title: 'Free track', is_streamable: true },
    ] }) };
  };
  const station = await fetchStation(new AbortController().signal);
  assert.equal(station.host, 'https://discoveryprovider.audius.co');
  assert.deepEqual(station.tracks.map(track => track.id), ['free']);
  assert.ok(!requests.some(url => url.includes('untrusted.example')));
  assert.ok(withApp(station.host, '/tracks/trending?limit=20').includes('&app_name='));
  const controller = new AbortController(); controller.abort();
  await assert.rejects(fetchStation(controller.signal), { name: 'AbortError' });
  globalThis.fetch = async () => { throw new Error('offline'); };
  await assert.rejects(fetchStation(new AbortController().signal), /No playable tracks/);
  console.log('PASS: provider failover, gated/premium filtering, host validation, cancellation, offline recovery');
} finally { globalThis.fetch = originalFetch; }
