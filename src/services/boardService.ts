import { collection, getDocs, orderBy, query, limit, Timestamp } from 'firebase/firestore';
import { db } from '../firebase.config';

/**
 * The Board — community notice board posts.
 *
 * Posts live in the `board_posts` Firestore collection. The board is
 * read-only from the client: the team pins new notes from the Firebase
 * console (Firestore → Data → board_posts → Add document), so no auth
 * flow is needed and visitors can never write to it.
 *
 * Document fields (all strings unless noted):
 *   title      — headline of the note (required)
 *   body       — the note text (required)
 *   tag        — small label, e.g. "Announcement" / "Mint" / "Event"
 *   link       — optional URL the note points at
 *   linkLabel  — text for the link button (defaults to "Open link")
 *   image      — optional image URL (rendered polaroid-style)
 *   paper      — 'white' | 'pink' | 'cyan' | 'yellow' (note paper color)
 *   published  — boolean; set false to hide a note without deleting it
 *   postedAt   — timestamp; newest notes are pinned first
 *
 * If Firestore is unreachable (or the collection is empty) the board
 * falls back to the starter notes in src/content/boardPosts.ts, which
 * can also be edited directly in the repo.
 */

export type BoardPaper = 'white' | 'pink' | 'cyan' | 'yellow';

export interface BoardPost {
  id: string;
  title: string;
  body: string;
  tag?: string;
  link?: string;
  linkLabel?: string;
  image?: string;
  paper?: BoardPaper;
  dateLabel?: string;
}

const PAPERS: BoardPaper[] = ['white', 'pink', 'cyan', 'yellow'];

const toDateLabel = (v: unknown): string | undefined => {
  if (v instanceof Timestamp) {
    return v.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return undefined;
};

/** How long to wait on Firestore before pinning the fallback notes.
 *  getDocs can retry for a long time when the network is flaky — the board
 *  shouldn't sit on skeletons that whole time. */
const FETCH_TIMEOUT_MS = 6000;

const timeout = <T,>(ms: number, value: T) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

/** Fetch published board posts, newest first. Returns [] when Firestore is
 *  unavailable (or slow) so callers can fall back to the in-repo starter notes. */
export async function fetchBoardPosts(): Promise<BoardPost[]> {
  if (!db) return [];
  try {
    const q = query(collection(db, 'board_posts'), orderBy('postedAt', 'desc'), limit(40));
    const snap = await Promise.race([getDocs(q), timeout(FETCH_TIMEOUT_MS, null)]);
    if (snap === null) {
      console.warn('[board] Firestore slow — pinning starter notes');
      return [];
    }
    return snap.docs
      .map((doc) => {
        const d = doc.data();
        if (d.published === false) return null;
        if (typeof d.title !== 'string' || typeof d.body !== 'string') return null;
        const paper = PAPERS.includes(d.paper) ? (d.paper as BoardPaper) : undefined;
        return {
          id: doc.id,
          title: d.title,
          body: d.body,
          tag: typeof d.tag === 'string' ? d.tag : undefined,
          link: typeof d.link === 'string' ? d.link : undefined,
          linkLabel: typeof d.linkLabel === 'string' ? d.linkLabel : undefined,
          image: typeof d.image === 'string' ? d.image : undefined,
          paper,
          dateLabel: toDateLabel(d.postedAt),
        } as BoardPost;
      })
      .filter((p): p is BoardPost => p !== null);
  } catch (e) {
    console.warn('[board] falling back to starter notes:', (e as Error)?.message);
    return [];
  }
}
