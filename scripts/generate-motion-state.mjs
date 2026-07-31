/**
 * Generates src/motion/sweetardio-motion.json — the Theatre.js state for the
 * landing hero "power-on" sequence. Run with:  node scripts/generate-motion-state.mjs
 *
 * You normally won't need this: the intended editing flow is visual, via the
 * Theatre Studio overlay in `npm run dev` (see MOTION.md). This script exists
 * so the initial choreography is reproducible and reviewable in code.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const EASE = [0.5, 1, 0.5, 0]; // Theatre's default cubic ease handles

let kfId = 0;
const kf = (position, value) => ({
  id: `kf${kfId++}`,
  position,
  connectedRight: true,
  handles: EASE,
  type: 'bezier',
  value,
});

let trId = 0;
const makeObject = (props) => {
  const trackData = {};
  const trackIdByPropPath = {};
  for (const [prop, frames] of Object.entries(props)) {
    const id = `tr${trId++}`;
    trackData[id] = {
      type: 'BasicKeyframedTrack',
      __debugName: `["${prop}"]`,
      keyframes: frames.map(([p, v]) => kf(p, v)),
    };
    trackIdByPropPath[`["${prop}"]`] = id;
  }
  return { trackData, trackIdByPropPath };
};

/* ── The choreography ─────────────────────────────────────────────
   An arcade cabinet booting up: the panel fades in, the badge drops,
   the wordmark neon flickers alive, then copy and the three arrows
   ignite in sequence. All times in seconds.                        */
const tracksByObject = {
  Panel: makeObject({
    opacity: [[0.0, 0], [0.5, 1]],
    y:       [[0.0, 0], [0.0, 0]],
    scale:   [[0.0, 0.965], [0.7, 1]],
  }),
  Badge: makeObject({
    opacity: [[0.15, 0], [0.7, 1]],
    y:       [[0.15, 34], [0.85, 0]],
  }),
  Chip: makeObject({
    opacity: [[0.5, 0], [0.9, 1]],
    y:       [[0.5, 16], [0.95, 0]],
  }),
  Wordmark: makeObject({
    /* neon tube striking: spikes before it holds steady */
    opacity: [[0.6, 0], [0.72, 0.9], [0.8, 0.12], [0.9, 1], [0.98, 0.3], [1.08, 1]],
    y:       [[0.6, 26], [1.2, 0]],
  }),
  Fun: makeObject({
    opacity: [[1.05, 0], [1.45, 1]],
    y:       [[1.05, 18], [1.5, 0]],
  }),
  Tagline: makeObject({
    opacity: [[1.3, 0], [1.7, 1]],
    y:       [[1.3, 14], [1.75, 0]],
  }),
  Kicker: makeObject({
    opacity: [[1.55, 0], [1.9, 1]],
    y:       [[1.55, 10], [1.95, 0]],
  }),
  ArrowL: makeObject({
    opacity: [[1.7, 0], [2.1, 1]],
    y:       [[1.7, 22], [2.15, 0]],
  }),
  ArrowC: makeObject({
    opacity: [[1.82, 0], [2.25, 1]],
    y:       [[1.82, 26], [2.3, 0]],
  }),
  ArrowR: makeObject({
    opacity: [[1.94, 0], [2.35, 1]],
    y:       [[1.94, 22], [2.4, 0]],
  }),
};

const state = {
  sheetsById: {
    Hero: {
      staticOverrides: { byObject: {} },
      sequence: {
        subUnitsPerUnit: 30,
        length: 2.6,
        type: 'PositionalSequence',
        tracksByObject,
      },
    },
  },
  definitionVersion: '0.4.0',
  revisionHistory: ['initial-poweron'],
};

const out = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/motion/sweetardio-motion.json',
);
writeFileSync(out, JSON.stringify(state, null, 2) + '\n');
console.log('wrote', out);
