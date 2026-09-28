/**
 * Where everything is, in each painting's own pixels.
 *
 * Measured on the locked originals in public/rx/. The web copies in
 * public/rx/web/ keep the same canvases (papers) or are placed by the rects
 * below (props), so nothing here depends on the display size.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Degrees, around the rect's centre. */
  rotate?: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Painting {
  src: string;
  w: number;
  h: number;
}

const web = (name: string) => `/rx/web/${name}`;

export const ART = {
  street: { src: web('room1-exterior.webp'), w: 1672, h: 941 },
  counter: { src: web('room2-counter.webp'), w: 1920, h: 1080 },
  pad: { src: web('paper-rx-pad.webp'), w: 1086, h: 1448 },
  receipt: { src: web('paper-filled-receipt.webp'), w: 1024, h: 1536 },
  bag: { src: web('paper-refused-bag.webp'), w: 1024, h: 1536 },
  sticker: { src: web('sticker-window-closed.webp'), w: 1536, h: 1024 },
  mobile: { src: web('overlay-mobile.webp'), w: 1024, h: 1536 },
} satisfies Record<string, Painting>;

export const PROPS = {
  bell: web('prop-bell.webp'),
  cupFull: web('prop-cup-full.webp'),
  cupEmpty: web('prop-cup-empty.webp'),
  trash: web('prop-trash.webp'),
  seal: web('seal-refused.webp'),
} as const;

/**
 * What each view keeps centred when the window's shape can't show the whole
 * painting (portrait tablets, phones, ultrawide). The rest can be dragged in.
 */
export const FOCUS = {
  /** The neon sign and the door under it. */
  street: { x: 837, y: 469 },
  /** The clerk and the bell. */
  counter: { x: 1080, y: 540 },
  /** The cup on the tray and the can on the floor. */
  catch: { x: 1405, y: 540 },
  /** The empty cup, the clerk's line and the mat out, clear of the receipt on the left. */
  took: { x: 900, y: 640 },
} satisfies Record<string, Point>;

/**
 * What a moment must show all at once, even on a phone: the catch is a choice
 * between the cup on the tray and the can on the floor (cup and can hotspots
 * plus a margin).
 */
export const KEEP = {
  catch: { x: 1022, y: 412, w: 765, h: 558 },
} satisfies Record<string, Rect>;

/** Room 1 — the street (1672 × 941). */
export const STREET = {
  door: { x: 748, y: 405, w: 178, h: 313 },
  leftWindow: { x: 296, y: 404, w: 432, h: 268 },
  rightWindow: { x: 949, y: 404, w: 416, h: 268 },
  sugar: { x: 1006, y: 748, w: 38, h: 20 },
} satisfies Record<string, Rect>;

/** Rooms 2 / 3B / Path A — the night window (1920 × 1080). */
export const COUNTER = {
  bell: { x: 1178, y: 468, w: 100, h: 80 },
  vending: { x: 42, y: 106, w: 368, h: 588 },
  trash: { x: 1545, y: 608, w: 218, h: 338 },
  /** Where the clerk's lines appear: above the pop-tart, inside the glass. */
  speech: { x: 760, y: 118, w: 440, h: 80 },
  /** The full cup, composited onto the tray left of the bell (no catch painting supplied). */
  cup: { x: 1058, y: 446, w: 82, h: 97 },
  /** Contact shadow under the cup, on the tray surface. */
  cupShadow: { x: 1052, y: 528, w: 94, h: 16 },
  /** Way out after Path A: the doormat you came in on. */
  mat: { x: 800, y: 948, w: 680, h: 132 },
  /** The ring pops above the painted bell when rung. */
  bellPop: { x: 1168, y: 350, w: 120, h: 108 },
} satisfies Record<string, Rect>;

/** Room 3A — the Rx pad (1086 × 1448). Boxes are the printed boxes. */
export const PAD = {
  identify: { x: 97, y: 423, w: 896, h: 132 },
  notes: { x: 97, y: 633, w: 896, h: 167 },
  bagBox: { x: 97, y: 878, w: 896, h: 165 },
  sideLabel: { x: 100, y: 1068, w: 300, h: 50 },
  sideList: { x: 104, y: 1124, w: 400, h: 168 },
  /** The email sign-in slip, laid over IDENTIFY YOURSELF and PHARMACIST NOTES while open. */
  slip: { x: 84, y: 410, w: 922, h: 404, rotate: -1.2 },
  send: { x: 520, y: 1165, w: 480, h: 130, rotate: -9 },
} satisfies Record<string, Rect>;

/** Room 4 — the bag (1024 × 1536). */
export const BAG = {
  /** The whole price sticker: PHASE 1 / 0.0420 SOL / PAY AT WINDOW. */
  pay: { x: 205, y: 1061, w: 665, h: 235, rotate: -5 },
  /** The printed price line, for a live-price tag if the chain disagrees. */
  price: { x: 452, y: 1128, w: 360, h: 72, rotate: -5 },
  /** Where WINDOW CLOSED gets slapped when the file is closed or the window is shut. */
  sticker: { x: 120, y: 930, w: 800, h: 533, rotate: 6 },
} satisfies Record<string, Rect>;

/** Phone gate (1024 × 1536). */
export const MOBILE = {
  enter: { x: 440, y: 1312, w: 250, h: 76 },
} satisfies Record<string, Rect>;
