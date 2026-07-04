import { useCallback, useEffect, useState } from 'react';
import { BoardPost, BoardPaper, fetchBoardPosts } from '../services/boardService';
import { FALLBACK_BOARD_POSTS } from '../content/boardPosts';

/**
 * The Board — the diner's cork notice board.
 *
 * Team announcements get pinned here as paper notes. Content comes from
 * the `board_posts` Firestore collection (posted via the Firebase console);
 * when that's empty or unreachable the starter notes from
 * src/content/boardPosts.ts are pinned instead. Click a note to read it
 * full-size.
 */

const PAPER_STYLES: Record<BoardPaper, { bg: string; text: string }> = {
  white: { bg: 'linear-gradient(180deg, #fffdf7 0%, #f4eede 100%)', text: '#1c2245' },
  pink: { bg: 'linear-gradient(180deg, #ffe3f2 0%, #fdc8e5 100%)', text: '#511437' },
  cyan: { bg: 'linear-gradient(180deg, #e0fbfc 0%, #c2f0f3 100%)', text: '#0d3b3f' },
  yellow: { bg: 'linear-gradient(180deg, #fdf6cf 0%, #f7e9a4 100%)', text: '#4a3c0a' },
};

const PAPER_CYCLE: BoardPaper[] = ['white', 'pink', 'cyan', 'yellow'];
const TILTS = [-2.4, 1.8, -1.2, 2.6, -1.9, 1.1];
const PIN_COLORS = ['#F715AB', '#34EDF3', '#9201CB', '#F7C815'];

const Pin = ({ color }: { color: string }) => (
  <span
    aria-hidden
    className="absolute -top-3 left-1/2 h-6 w-6 -translate-x-1/2"
    style={{
      borderRadius: '9999px',
      background: `radial-gradient(circle at 32% 28%, #ffffffcc, ${color} 45%, ${color})`,
      boxShadow: `0 6px 6px -2px rgba(0,0,0,0.45), 0 0 10px ${color}66`,
    }}
  />
);

interface NoteProps {
  post: BoardPost;
  index: number;
  onOpen: (post: BoardPost) => void;
}

const Note = ({ post, index, onOpen }: NoteProps) => {
  const paper = PAPER_STYLES[post.paper ?? PAPER_CYCLE[index % PAPER_CYCLE.length]];
  return (
    <button
      type="button"
      onClick={() => onOpen(post)}
      className="sw-note relative block w-full cursor-pointer p-5 pt-6 text-left"
      style={{
        ['--note-tilt' as string]: `${TILTS[index % TILTS.length]}deg`,
        background: paper.bg,
        color: paper.text,
        boxShadow: '0 10px 24px -8px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.3)',
      }}
      aria-label={`Read note: ${post.title}`}
    >
      <Pin color={PIN_COLORS[index % PIN_COLORS.length]} />

      {post.tag && (
        <span className="mb-2 inline-block border border-current/25 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.22em] opacity-70">
          {post.tag}
        </span>
      )}

      <h3 className="font-heading text-xl leading-tight">{post.title}</h3>

      {post.image && (
        <img src={post.image} alt="" className="mt-3 max-h-40 w-full object-cover" loading="lazy" />
      )}

      <p className="mt-2 line-clamp-5 text-sm leading-relaxed opacity-85">{post.body}</p>

      <div className="mt-4 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide opacity-60">
        <span>{post.dateLabel ?? ''}</span>
        <span>{post.link ? 'Read more ↗' : 'Tap to read'}</span>
      </div>
    </button>
  );
};

const NoteModal = ({ post, onClose }: { post: BoardPost; onClose: () => void }) => {
  const paper = PAPER_STYLES[post.paper ?? 'white'];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={post.title}
      onClick={onClose}
    >
      <div
        className="sw-rise relative max-h-[85vh] w-full max-w-lg overflow-y-auto p-7 pt-9"
        style={{ background: paper.bg, color: paper.text, boxShadow: '0 30px 80px -20px rgba(0,0,0,0.9)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <Pin color="#F715AB" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close note"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center border border-current/20 text-sm font-bold opacity-60 transition-opacity hover:opacity-100"
        >
          ✕
        </button>

        {post.tag && (
          <span className="mb-3 inline-block border border-current/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.22em] opacity-70">
            {post.tag}
          </span>
        )}
        <h2 className="font-heading pr-8 text-3xl leading-tight">{post.title}</h2>
        {post.dateLabel && (
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide opacity-55">{post.dateLabel}</p>
        )}

        {post.image && <img src={post.image} alt="" className="mt-4 w-full object-cover" />}

        <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed opacity-90">{post.body}</p>

        {post.link && (
          <a
            href={post.link}
            {...(post.link.startsWith('#') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
            className="sw-shine mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold uppercase tracking-wide text-white"
            style={{ background: '#F715AB' }}
          >
            {post.linkLabel ?? 'Open link'} <span aria-hidden>↗</span>
          </a>
        )}
      </div>
    </div>
  );
};

export default function BoardPage() {
  const [posts, setPosts] = useState<BoardPost[] | null>(null);
  const [open, setOpen] = useState<BoardPost | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchBoardPosts().then((remote) => {
      if (!cancelled) setPosts(remote.length > 0 ? remote : FALLBACK_BOARD_POSTS);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const close = useCallback(() => setOpen(null), []);

  return (
    <div className="relative min-h-[calc(100vh-var(--navbar-height,56px))] overflow-hidden text-white">
      {/* Diner back-room: navy tiled walls + vignette */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #0a0e2c 0%, #070b22 55%, #040614 100%)' }} />
        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(120,140,255,0.25) 0 1px, transparent 1px 44px), repeating-linear-gradient(90deg, rgba(120,140,255,0.25) 0 1px, transparent 1px 44px)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(120% 90% at 50% 8%, transparent 30%, rgba(4,6,20,0.75) 78%, rgba(2,3,12,0.95) 100%)' }}
        />
        <div className="sw-scanlines absolute inset-0 opacity-[0.08]" />
      </div>

      <section className="mx-auto max-w-5xl px-5 pb-20 pt-10 sm:px-8">
        {/* Neon header */}
        <header className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-sweetardios-cyan">Sweetardio Diner</p>
          <h1 className="font-heading mt-1 text-5xl sm:text-6xl">
            <span className="sw-glow-cerise sw-flicker text-sweetardios-cerise">The</span>{' '}
            <span className="sw-glow-cyan text-sweetardios-cyan">Board</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-blue-100/70">
            News, mint updates and events — pinned by the Sweetardio team. Click a note to read it.
          </p>
        </header>

        {/* Neon tube mounted above the board */}
        <div className="relative mt-10 px-2 sm:px-6">
          <div className="mx-auto flex w-[92%] items-center gap-3">
            <div className="sw-neon-tube h-1.5 flex-1" style={{ borderRadius: '9999px' }} />
            <div className="sw-neon-tube h-1.5 flex-1" style={{ borderRadius: '9999px' }} />
          </div>
        </div>

        {/* The cork board */}
        <div
          className="relative mt-5 p-2 sm:p-2.5"
          style={{
            background: 'linear-gradient(160deg, #d8dbe4 0%, #8d93a5 30%, #c6cad6 55%, #6f7488 85%, #b9bdcb 100%)',
            boxShadow: '0 40px 100px -30px rgba(0,0,0,0.9), 0 0 60px -10px rgba(247,21,171,0.18)',
          }}
        >
          <div className="sw-cork relative p-5 sm:p-8" style={{ boxShadow: 'inset 0 0 40px rgba(40,18,0,0.55)' }}>
            {posts === null ? (
              /* Skeleton notes while the board loads */
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-44 animate-pulse bg-white/80"
                    style={{ transform: `rotate(${TILTS[i]}deg)`, boxShadow: '0 10px 24px -8px rgba(0,0,0,0.55)' }}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post, i) => (
                  <Note key={post.id} post={post} index={i} onOpen={setOpen} />
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] uppercase tracking-[0.24em] text-white/35">
          Fresh notes get pinned here — check back often
        </p>
      </section>

      {open && <NoteModal post={open} onClose={close} />}
    </div>
  );
}
