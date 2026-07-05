import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import NeonArrow, { ArrowColor, ArrowDir } from './NeonArrow';

/* ── Scene graph ───────────────────────────────────────────────
   The player walks through the painted Sweetardio scene by clicking
   the recreated neon arrows (or pressing the keyboard arrow keys):

     lobby ─┬─up──▶ arcade ─┬─up──▶ gallery ─┬─up──▶ /board (notice board)
            │               │                └─right▶ member's only (VIP)
            │               ├─left──▶ slots cabinet ─▶ /slots
            ├─left──▶ slots │
            └─right─▶ pusher└─right─▶ pusher cabinet ▶ /coinpusher

   "Back" is implicit: a history stack remembers the path, and a small
   arrow in the top-left always steps back the way you came.
   ────────────────────────────────────────────────────────────── */

type SceneId = 'lobby' | 'arcade' | 'slots' | 'pusher' | 'gallery' | 'members';

interface Exit {
  dir: Exclude<ArrowDir, 'down'>; // forward / branch arrows only; back is automatic
  label: string;
  to?: SceneId; // walk to another scene…
  route?: string; // …or step out into a game route
  color?: ArrowColor;
  size?: number;
  floor?: boolean;
}

interface SceneDef {
  image: string;
  kicker: string;
  title: string;
  blurb?: string;
  badge?: string;
  exits: Exit[];
}

/** Where each arrow sits over the scene. The forward arrow floats above the
 *  controls hint / bottom widgets; the branch arrows sit a touch below the
 *  vertical centre so they never collide with the title block up top. Back
 *  lives in the top-left corner, clear of the mascot (bottom-left) and music
 *  (bottom-right) widgets. */
const POS: Record<ArrowDir, string> = {
  up: 'absolute bottom-[13%] left-1/2 -translate-x-1/2 sm:bottom-[15%]',
  left: 'absolute top-[54%] left-[5%] -translate-y-1/2 sm:left-[9%]',
  right: 'absolute top-[54%] right-[5%] -translate-y-1/2 sm:right-[9%]',
  down: 'absolute left-4 top-4 sm:left-6 sm:top-6',
};

const SCENES: Record<SceneId, SceneDef> = {
  lobby: {
    // Clean bakery plate (no painted-in arrows) — our neon arrows are the only ones.
    image: '/games-bg.png',
    kicker: 'Sweetardio Collection',
    title: 'The Sweet Shop',
    blurb: 'Follow the neon — head straight in, or pick a machine.',
    exits: [
      { dir: 'left', to: 'slots', label: 'Slots, this way', size: 96 },
      { dir: 'right', to: 'pusher', label: 'Coin pusher, this way', color: 'cyan', size: 96 },
      { dir: 'up', to: 'arcade', label: 'Into the arcade', floor: true, size: 120 },
    ],
  },
  arcade: {
    image: '/scenes/arcade.png',
    kicker: 'The Arcade',
    title: 'Pick Your Machine',
    blurb: 'Slots on the left, coin pusher on the right — or head to the gallery in the back.',
    exits: [
      { dir: 'left', to: 'slots', label: 'Walk up to the slots', size: 92 },
      { dir: 'right', to: 'pusher', label: 'Walk up to the coin pusher', color: 'cyan', size: 92 },
      { dir: 'up', to: 'gallery', label: 'Into the gallery', floor: true, size: 104 },
    ],
  },
  gallery: {
    image: '/scenes/gallery.png',
    kicker: 'The Gallery',
    title: 'The Board',
    blurb: 'News and updates get pinned to the cork — walk up and read them.',
    exits: [
      { dir: 'up', route: '/board', label: 'Read The Board', floor: true, size: 116 },
      { dir: 'right', to: 'members', label: "Member's Only", color: 'cyan', size: 84 },
    ],
  },
  slots: {
    image: '/scenes/slots-cabinet.png',
    kicker: 'Slots',
    title: 'Sweetardio Collection',
    blurb: 'Spin sugar-coated reels and chase the $42,069 jackpot.',
    exits: [{ dir: 'up', route: '/slots', label: 'Play Slots', floor: true, size: 122 }],
  },
  pusher: {
    image: '/scenes/pusher-cabinet.png',
    kicker: 'Coin Pusher',
    title: 'Win Big',
    blurb: 'Drop candy tokens, stack the pile, shove the jackpot over the edge.',
    exits: [{ dir: 'up', route: '/coinpusher', label: 'Play Coin Pusher', color: 'cyan', floor: true, size: 122 }],
  },
  members: {
    image: '/scenes/members.png',
    kicker: "Member's Only",
    title: 'VIP Lounge',
    blurb: 'Something sweet is coming from behind the curtain.',
    badge: 'Coming Soon',
    exits: [],
  },
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface SceneState {
  stack: SceneId[]; // history; current = last entry
  anim: ArrowDir; // direction that drives the enter animation
}

type SceneAction =
  | { type: 'GO'; to: SceneId; anim: ArrowDir }
  | { type: 'BACK' };

const reducer = (state: SceneState, action: SceneAction): SceneState => {
  switch (action.type) {
    case 'GO':
      return { stack: [...state.stack, action.to], anim: action.anim };
    case 'BACK':
      return state.stack.length > 1
        ? { stack: state.stack.slice(0, -1), anim: 'down' }
        : state;
    default:
      return state;
  }
};

/** Deep-link entry points (e.g. /arcade?to=slots) seed a sensible walk-in
 *  history so the player still has a "back" trail to the lobby. */
const SEED: Record<string, SceneId[]> = {
  arcade: ['lobby', 'arcade'],
  slots: ['lobby', 'arcade', 'slots'],
  pusher: ['lobby', 'arcade', 'pusher'],
  gallery: ['lobby', 'arcade', 'gallery'],
  members: ['lobby', 'arcade', 'gallery', 'members'],
};

const ArcadeScene: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, dispatch] = useReducer(reducer, undefined, (): SceneState => ({
    stack: SEED[searchParams.get('to') ?? ''] ?? ['lobby'],
    anim: 'up',
  }));
  const [leaving, setLeaving] = useState<{ route: string } | null>(null);
  const busyRef = useRef(false);

  const sceneId = state.stack[state.stack.length - 1];
  const scene = SCENES[sceneId];
  const canGoBack = state.stack.length > 1;

  // Preload every backdrop so transitions never flash.
  useEffect(() => {
    Object.values(SCENES).forEach((s) => {
      const img = new Image();
      img.src = s.image;
    });
  }, []);

  const enter = useCallback(
    (route: string) => {
      if (busyRef.current) return;
      if (prefersReducedMotion()) {
        navigate(route);
        return;
      }
      busyRef.current = true;
      setLeaving({ route });
    },
    [navigate],
  );

  const go = useCallback(
    (exit: Exit) => {
      if (busyRef.current) return;
      if (exit.route) enter(exit.route);
      else if (exit.to) dispatch({ type: 'GO', to: exit.to, anim: exit.dir });
    },
    [enter],
  );

  const back = useCallback(() => {
    if (busyRef.current) return;
    dispatch({ type: 'BACK' });
  }, []);

  // Fade to black, then step into the game.
  useEffect(() => {
    if (!leaving) return;
    const t = window.setTimeout(() => navigate(leaving.route), 330);
    return () => window.clearTimeout(t);
  }, [leaving, navigate]);

  // Keyboard navigation — arrow keys walk the scene, Esc/Backspace step back.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (busyRef.current) return;
      if (e.key === 'Escape' || e.key === 'Backspace') {
        if (canGoBack) {
          e.preventDefault();
          back();
        }
        return;
      }
      const keyToDir: Record<string, ArrowDir> = {
        ArrowUp: 'up',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      };
      const dir = keyToDir[e.key];
      if (e.key === 'ArrowDown' && canGoBack) {
        e.preventDefault();
        back();
        return;
      }
      if (!dir) return;
      const exit = scene.exits.find((x) => x.dir === dir);
      if (exit) {
        e.preventDefault();
        go(exit);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [scene, canGoBack, go, back]);

  return (
    <div className="relative h-[calc(100vh-var(--navbar-height,56px))] w-full select-none overflow-hidden bg-black">
      {/* Keyed wrapper → remounts on scene change so the enter animation plays. */}
      <div key={sceneId} className={`absolute inset-0 sw-scene-in-${state.anim}`}>
        <img
          src={scene.image}
          alt={scene.title}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Cinematic depth: scrim (mutes the painted backdrop) + vignette + scanlines. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/60" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(125% 95% at 50% 40%, transparent 42%, rgba(7,15,52,0.4) 80%, rgba(2,5,20,0.85) 100%)',
          }}
        />
        <div aria-hidden className="sw-scanlines pointer-events-none absolute inset-0 opacity-[0.08]" />

        {/* HUD + arrows fade in once the scene settles. */}
        <div className="sw-hud-in absolute inset-0">
          {/* Caption */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center px-16 pt-5 text-center sm:pt-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-sweetardios-cyan sm:text-xs">
              {scene.kicker}
            </p>
            <h2 className="sw-glow-cerise font-heading mt-1 text-3xl text-white sm:text-5xl">{scene.title}</h2>
            {scene.blurb && (
              <p className="mt-2 max-w-md text-xs leading-relaxed text-blue-100/80 sm:text-sm">{scene.blurb}</p>
            )}
            {scene.badge && (
              <span className="mt-3 inline-flex items-center gap-2 border border-sweetardios-cyan/50 bg-sweetardios-oxford/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-sweetardios-cyan backdrop-blur">
                <span className="h-1.5 w-1.5 bg-sweetardios-cyan shadow-[0_0_8px_#34EDF3]" /> {scene.badge}
              </span>
            )}
          </div>

          {/* Back arrow (top-left) — appears once you've walked in somewhere. */}
          {canGoBack && (
            <div className={POS.down}>
              <NeonArrow dir="left" label="Go back" color="cyan" size={48} onClick={back} />
            </div>
          )}

          {/* Recreated neon navigation arrows */}
          {scene.exits.map((exit) => (
            <div key={exit.dir} className={POS[exit.dir]}>
              <NeonArrow
                dir={exit.dir}
                label={exit.label}
                color={exit.color}
                size={exit.size}
                floor={exit.floor}
                onClick={() => go(exit)}
              />
            </div>
          ))}

          {/* Controls hint */}
          <div className="pointer-events-none absolute bottom-2 left-1/2 hidden -translate-x-1/2 text-[10px] uppercase tracking-[0.22em] text-white/40 sm:block">
            Click an arrow · or use your ← ↑ → keys
          </div>
        </div>
      </div>

      {/* Step-into-the-game fade-to-black */}
      {leaving && <div aria-hidden className="sw-to-black absolute inset-0 z-30 bg-black" />}
    </div>
  );
};

export default ArcadeScene;
