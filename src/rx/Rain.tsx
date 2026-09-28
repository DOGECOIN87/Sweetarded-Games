/**
 * Rain on the street (ROOM 1, and behind the phone notice taped up outside).
 * Screen-space streaks in stained-paper white with the odd one catching the
 * cyan neon, a slight lean, and small splashes on the wet pavement. Drawn on
 * one canvas that never takes a tap. Anyone who asks for reduced motion gets
 * a lighter, slower rain.
 */
import { useEffect, useRef, useState } from 'react';

interface Drop {
  x: number;
  y: number;
  /** 0.35 (far, faint, slow) … 1 (near). */
  depth: number;
  len: number;
  speed: number;
  neon: boolean;
}

interface Splash {
  x: number;
  y: number;
  age: number;
}

/** Streaks lean right: horizontal travel per unit of fall. */
const LEAN = 0.14;
const SPLASH_S = 0.28;

export function Rain() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [gentle] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return undefined;
    const pace = gentle ? 0.4 : 1;

    let w = 0;
    let h = 0;
    let drops: Drop[] = [];
    let splashes: Splash[] = [];

    const drop = (anywhere: boolean): Drop => {
      const depth = 0.35 + Math.random() * 0.65;
      return {
        x: Math.random() * (w + h * LEAN) - h * LEAN,
        y: anywhere ? Math.random() * h : -Math.random() * h * 0.3,
        depth,
        len: (28 + Math.random() * 34) * depth,
        speed: (640 + Math.random() * 520) * (0.55 + depth * 0.6) * pace,
        neon: Math.random() < 0.18,
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(440, Math.max(170, (w * h) / 2600)) * (gentle ? 0.5 : 1));
      drops = Array.from({ length: count }, () => drop(true));
      splashes = [];
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      // rAF's timestamp can predate the performance.now() taken at start: never step backwards.
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = 'round';

      // Far drops thin and faint, near ones heavier; a few catch the cyan neon.
      for (const neon of [false, true]) {
        for (const near of [false, true]) {
          ctx.beginPath();
          for (const d of drops) {
            if (d.neon !== neon || d.depth > 0.7 !== near) continue;
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(d.x - d.len * LEAN, d.y - d.len);
          }
          ctx.strokeStyle = neon
            ? `rgb(52 237 243 / ${near ? 0.7 : 0.4})`
            : `rgb(239 233 223 / ${near ? 0.55 : 0.3})`;
          ctx.lineWidth = near ? 1.8 : 1.1;
          ctx.stroke();
        }
      }

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        const fall = d.speed * dt;
        d.y += fall;
        d.x += fall * LEAN;
        // Near drops land on the pavement (the lower part of the street); the rest fall past.
        const ground = h * (0.8 + (1 - d.depth) * 0.2);
        if (d.y >= ground) {
          if (d.depth > 0.72 && splashes.length < 48) splashes.push({ x: d.x, y: ground, age: 0 });
          drops[i] = drop(false);
        }
      }

      ctx.strokeStyle = 'rgb(239 233 223 / 0.65)';
      ctx.lineWidth = 1;
      splashes = splashes.filter((s) => (s.age += dt) < SPLASH_S);
      for (const s of splashes) {
        const k = s.age / SPLASH_S;
        ctx.globalAlpha = 1 - k;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, 1.5 + k * 6, 0.6 + k * 1.8, 0, Math.PI, 2 * Math.PI);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [gentle]);

  return <canvas ref={ref} className="rx-rain" aria-hidden />;
}
