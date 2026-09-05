#!/usr/bin/env node
/**
 * Arcade Cup draw — reproducible, auditable, offline.
 *
 *   node scripts/draw-competition.mjs --seed "<published seed>"
 *   node scripts/draw-competition.mjs --seed "<seed>" --json winners.json
 *
 * WHY A SEED
 * ----------
 * A draw nobody can check is just an announcement. Publish the seed BEFORE
 * running this — a Solana block hash from a stated slot is ideal, because you
 * cannot have known it while the competition was open — and anyone can re-run
 * this script against the public entries and get byte-identical winners.
 *
 * The entry collection is publicly readable, so this needs no credentials.
 * It never writes anything: allocate the mints yourself after reading the
 * audit section, which flags the sybil patterns the ticket caps cannot.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const PROJECT = 'sweetardio';
const API_KEY = 'AIzaSyCM-j6N7elfsWz1JIOW2FnZZWiigsjncsE'; // public web key
const COLLECTION = 'competition_tickets';
const PRIZE_LADDER = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

const args = process.argv.slice(2);
const argOf = (flag) => {
  const i = args.indexOf(flag);
  return i === -1 ? null : args[i + 1] ?? null;
};

const seed = argOf('--seed');
const jsonOut = argOf('--json');
const includeUnbound = args.includes('--include-unbound');
/** Rehearse the draw against a local entries file instead of live Firestore. */
const fixture = argOf('--fixture');

if (!seed) {
  console.error('Missing --seed. Publish a seed first, then pass it here.');
  console.error('Example: node scripts/draw-competition.mjs --seed 5Xk...blockhash');
  process.exit(1);
}

/** Deterministic PRNG: SHA-256 counter stream seeded by the published seed. */
function makeRng(seedText) {
  let counter = 0;
  let pool = Buffer.alloc(0);
  const refill = () => {
    pool = createHash('sha256').update(`${seedText}:${counter++}`).digest();
  };
  return () => {
    if (pool.length < 6) refill();
    // 48 bits of entropy -> [0,1), then consume those bytes.
    const v = pool.readUIntBE(0, 6) / 2 ** 48;
    pool = pool.subarray(6);
    return v;
  };
}

async function fetchEntries() {
  const rows = [];
  let pageToken = '';
  do {
    const url =
      `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${COLLECTION}` +
      `?pageSize=300&key=${API_KEY}${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Firestore read failed: ${res.status} ${await res.text()}`);
    const body = await res.json();
    for (const doc of body.documents ?? []) {
      const f = doc.fields ?? {};
      const val = (k) => {
        const v = f[k];
        if (!v) return null;
        return v.stringValue ?? (v.integerValue != null ? Number(v.integerValue) : null) ??
          (v.nullValue !== undefined ? null : v.timestampValue ?? null);
      };
      rows.push({
        player: doc.name.split('/').pop(),
        name: val('name') ?? 'Anon',
        wallet: val('wallet'),
        tickets: Number(val('tickets') ?? 0),
        updatedAt: f.updatedAt?.timestampValue ?? null,
      });
    }
    pageToken = body.nextPageToken ?? '';
  } while (pageToken);
  return rows.filter((r) => r.tickets > 0);
}

/** Weighted draw WITHOUT replacement — nobody wins two prize slots. */
function drawWinners(pool, count, rng) {
  const remaining = pool.map((e) => ({ ...e }));
  const winners = [];
  while (winners.length < count && remaining.length > 0) {
    const total = remaining.reduce((s, e) => s + e.tickets, 0);
    if (total <= 0) break;
    let pick = rng() * total;
    let idx = 0;
    for (; idx < remaining.length; idx++) {
      pick -= remaining[idx].tickets;
      if (pick <= 0) break;
    }
    const [winner] = remaining.splice(Math.min(idx, remaining.length - 1), 1);
    winners.push({ ...winner, oddsAtDraw: winner.tickets / total });
  }
  return winners;
}

const all = fixture
  ? JSON.parse(readFileSync(fixture, 'utf8')).filter((r) => r.tickets > 0)
  : await fetchEntries();
const eligible = includeUnbound ? all : all.filter((e) => e.wallet);
const totalTickets = eligible.reduce((s, e) => s + e.tickets, 0);

console.log(`═══ ARCADE CUP DRAW ═══${fixture ? '  (DRY RUN — fixture data)' : ''}`);
console.log(`seed              : ${seed}`);
console.log(`seed sha256       : ${createHash('sha256').update(seed).digest('hex')}`);
console.log(`entries total     : ${all.length}`);
console.log(`eligible (wallet) : ${eligible.length}${includeUnbound ? ' (--include-unbound)' : ''}`);
console.log(`tickets in pool   : ${totalTickets}`);

if (eligible.length === 0) {
  console.error('\nNo eligible entries — nothing to draw.');
  process.exit(1);
}
if (eligible.length < PRIZE_LADDER.length) {
  console.warn(
    `\n⚠  Only ${eligible.length} eligible entrants for ${PRIZE_LADDER.length} prize slots.` +
      ' The lower slots will go unawarded.'
  );
}

const winners = drawWinners(eligible, PRIZE_LADDER.length, makeRng(seed));

console.log('\n─── WINNERS ───');
const results = winners.map((w, i) => {
  const mints = PRIZE_LADDER[i];
  console.log(
    `${String(i + 1).padStart(2)}.  ${mints} mint${mints > 1 ? 's' : ''}  ` +
      `${w.name.padEnd(24)} ${w.wallet ?? '(no wallet)'}  ` +
      `[${w.tickets} tickets, ${(w.oddsAtDraw * 100).toFixed(2)}% at draw]`
  );
  return { position: i + 1, mints, name: w.name, player: w.player, wallet: w.wallet, tickets: w.tickets };
});
console.log(`\ntotal mints awarded: ${results.reduce((s, r) => s + r.mints, 0)}`);

// ── Audit ────────────────────────────────────────────────────────────
// The ticket caps make score-forging pointless but say nothing about one
// person running several handles. These are the patterns worth a human look.
console.log('\n─── AUDIT (review before allocating) ───');

const byWallet = new Map();
for (const e of eligible) {
  if (!e.wallet) continue;
  byWallet.set(e.wallet, [...(byWallet.get(e.wallet) ?? []), e]);
}
const dupWallets = [...byWallet.entries()].filter(([, v]) => v.length > 1);
console.log(
  dupWallets.length
    ? `⚠  ${dupWallets.length} wallet(s) claimed by multiple handles:`
    : '✓  No wallet claimed by more than one handle.'
);
for (const [w, list] of dupWallets) {
  console.log(`     ${w} → ${list.map((e) => `${e.name}(${e.tickets})`).join(', ')}`);
}

const maxed = eligible.filter((e) => e.tickets >= 80);
console.log(`${maxed.length ? '•' : '✓'}  ${maxed.length} entrant(s) at the ticket ceiling.`);

const winnersMaxed = results.filter((r) => r.tickets >= 80).length;
console.log(`•  ${winnersMaxed} of ${results.length} winners were at the ceiling.`);

if (jsonOut) {
  writeFileSync(
    jsonOut,
    JSON.stringify(
      { seed, drawnAt: new Date().toISOString(), entrants: eligible.length, totalTickets, winners: results },
      null,
      2
    )
  );
  console.log(`\nwritten → ${jsonOut}`);
}
