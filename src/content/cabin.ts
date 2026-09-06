/**
 * SEAT AIRWAYS — cabin layout and copy.
 *
 * The premise: your bag is your seat. Bigger bag, better seat. Seats are
 * finite, so a bigger bag can take yours — you get reseated, and the whole
 * cabin hears about it over the PA.
 *
 * Everything here is content, not logic. The seat ladder, the class names and
 * the radio chatter all live in this file so the copy can be rewritten without
 * touching the flight model or the components.
 */

export type ZoneKey = 'deck' | 'first' | 'business' | 'exit' | 'economy';

/**
 * Where a seat sits across the cabin. This is what decides the view you get
 * when you claim it: a window seat is at the glass, an aisle seat is looking
 * down the aisle with the window a row away, and a middle seat has someone
 * else's shoulder between it and the daylight.
 */
export type SeatPosition = 'window' | 'middle' | 'aisle';

export interface CabinZone {
  key: ZoneKey;
  /** Signage name, as it reads on the bulkhead. */
  name: string;
  /** The rank this zone represents, in plain words. */
  note: string;
  /** Boarding pass class line. */
  className: string;
  /** Boarding group. */
  group: string;
  /** What you get for sitting here — printed on the pass. */
  perk: string;
  /** Seat rows. The flight deck has no rows; it has two chairs. */
  rows: readonly CabinRow[];
  /** Accent the zone wears in the seat map. */
  accent: 'cerise' | 'cyan' | 'violet';
}

export interface CabinRow {
  /** Row number, or null for the flight deck. */
  n: number | null;
  left: readonly string[];
  right: readonly string[];
}

const rowRange = (from: number, to: number, left: string[], right: string[]): CabinRow[] => {
  const out: CabinRow[] = [];
  for (let n = from; n <= to; n++) out.push({ n, left, right });
  return out;
};

const LR = ['A', 'B', 'C'];
const RR = ['D', 'E', 'F'];

export const CABIN_ZONES: readonly CabinZone[] = [
  {
    key: 'deck',
    name: 'Flight Deck',
    note: 'Top 2 holders',
    className: 'FLIGHT DECK',
    group: '1',
    perk: 'You have the PA. One announcement a day. Use it well.',
    accent: 'cerise',
    rows: [{ n: null, left: ['CPT'], right: ['FO'] }],
  },
  {
    key: 'first',
    name: 'First',
    note: 'Rows 1–2',
    className: 'FIRST',
    group: '1',
    perk: 'Lie-flat. Champagne on every green candle.',
    accent: 'cerise',
    rows: rowRange(1, 2, ['A', 'B'], ['E', 'F']),
  },
  {
    key: 'business',
    name: 'Business',
    note: 'Rows 3–7',
    className: 'BUSINESS',
    group: '2',
    perk: 'Priority boarding, and first off the aircraft in an emergency landing.',
    accent: 'violet',
    rows: rowRange(3, 7, LR, RR),
  },
  {
    key: 'exit',
    name: 'Exit Row',
    note: 'Sign to sit here',
    className: 'EXIT ROW',
    group: '3',
    perk: 'You have agreed to open that door. Sign the message.',
    accent: 'cyan',
    rows: rowRange(16, 17, LR, RR),
  },
  {
    key: 'economy',
    name: 'Economy',
    note: 'Rows 8–15, 18–30',
    className: 'ECONOMY',
    group: '4',
    perk: 'Seat back and tray table. Welcome aboard.',
    accent: 'cyan',
    rows: [...rowRange(8, 15, LR, RR), ...rowRange(18, 30, LR, RR)],
  },
];

export interface CabinSeat {
  id: string;
  zone: ZoneKey;
  row: number | null;
  position: SeatPosition;
}

/**
 * Position within a bank of seats.
 *
 * Read off the layout rather than hard-coded per letter, because the cabin is
 * not one shape: First is 2-2, so its B and E are aisle seats, while the same
 * letters in a 3-3 row are middles. `side` says which end of the bank the
 * aisle is on.
 */
function positionIn(index: number, count: number, side: 'left' | 'right'): SeatPosition {
  const fromWindow = side === 'left' ? index : count - 1 - index;
  if (fromWindow === 0) return 'window';
  return fromWindow === count - 1 ? 'aisle' : 'middle';
}

/** Every seat on the aircraft, flattened, in boarding order. */
export const ALL_SEATS: readonly CabinSeat[] = CABIN_ZONES.flatMap((zone) =>
  zone.rows.flatMap((row) => [
    ...row.left.map((letter, i) => ({
      id: row.n === null ? letter : `${row.n}${letter}`,
      zone: zone.key,
      row: row.n,
      position: positionIn(i, row.left.length, 'left'),
    })),
    ...row.right.map((letter, i) => ({
      id: row.n === null ? letter : `${row.n}${letter}`,
      zone: zone.key,
      row: row.n,
      position: positionIn(i, row.right.length, 'right'),
    })),
  ]),
);

/** Look up one seat by id. */
export function findSeat(id: string | null): CabinSeat | null {
  if (!id) return null;
  return ALL_SEATS.find((s) => s.id === id) ?? null;
}

/** The worst seat on the aircraft, kept free so anyone can always board. */
export const LAVATORY_SEATS = ['30B', '30E'] as const;

export const LAVATORY_NOTE =
  'Middle seat, last row, by the lavatory. Does not recline. Merch this.';

/** Seats below the cutoff ride down here. It is not a punishment. */
export const CARGO_HOLD = {
  name: 'Cargo Hold',
  note: 'Everyone below the cutoff',
  body:
    'Unpressurized, and by far the biggest room on the aircraft — it is where most of your holders will live. ' +
    'It has its own leaderboard. Make it somewhere people want to post from.',
} as const;

/** Radio chatter. `tone` picks the colour the line reads in. */
export interface RadioLine {
  text: string;
  tone: 'pa' | 'alert' | 'plain';
}

export const CHATTER: readonly RadioLine[] = [
  { text: 'Cabin crew, doors to arrival and crosscheck.', tone: 'pa' },
  { text: 'Passenger in 14C has deplaned mid-flight.', tone: 'alert' },
  { text: 'Seat 2A claimed. Previous occupant reseated to 27E.', tone: 'pa' },
  { text: 'Captain: "This is your captain speaking. We are not turning around."', tone: 'pa' },
  { text: 'Beverage cart rolling. Fee rewards distributed to rows 1–7.', tone: 'plain' },
  { text: 'Air marshal reassigned. Nobody knows who.', tone: 'plain' },
  { text: 'Someone in the cargo hold is knocking.', tone: 'plain' },
  { text: 'Exit row signature verified. 16A may open the door.', tone: 'plain' },
  { text: 'Galley reports the ice has not survived the descent.', tone: 'plain' },
  { text: 'Row 9 has been asked twice to stow the bag. It will not fit.', tone: 'plain' },
];

/** Announcements tied to a change in the aircraft's state, not to the clock. */
export const CALLOUTS = {
  boarded: 'Boarding complete. Cabin doors armed.',
  oxygenOn: 'Oxygen masks deployed. Secure your own before assisting others.',
  oxygenOff: 'Masks stowed. We have levelled off.',
  brace: 'Brace. Brace. Heads down, stay down.',
  dive: 'Beginning our descent. It was not scheduled.',
  climb: 'Cabin crew, prepare for climb.',
  turbulence: 'Rough air ahead. Seat belt sign is on.',
} as const;
