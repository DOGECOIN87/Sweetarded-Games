/**
 * Rain on the street (ROOM 1, and behind the phone notice taped up outside).
 * Screen-space streaks in stained-paper white with the odd one catching the
 * cyan neon (rarer, the cerise), in three depths: far drops thin, faint and
 * slow, near ones heavy with a bright head and a fading tail. The wind comes
 * and goes, leaning the rain and hurrying it along. Near drops hit the wet
 * pavement with a crown, a ripple, and a few droplets thrown up. Drawn on one
 * canvas that never takes a tap. Anyone who asks for reduced motion gets a
 * lighter, slower, steadier rain.
 */
import { useEffect, useRef, useState } from 'react';

type Tint = 0 | 1 | 2; // paper, cyan, cerise

interface Drop {
  x: number;
  y: number;
  /** 0.3 (far, faint, slow) … 1 (near). */
  depth: number;
  layer: 0 | 1 | 2;
  len: number;
  speed: number;
  tint: Tint;
}

interface Splash {
  x: number;
  y: number;
  age: number;
  size: number;
}

interface Droplet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
}

/** Streaks lean right: horizontal travel per unit of fall, before the wind. */
const LEAN = 0.14;
const SPLASH_S = 0.32;
const RIPPLE_S = 0.6;
const DROPLET_S = 0.36;
const GRAVITY = 1400;

const RGB: Record<Tint, string> = { 0: '239 233 223', 1: '52 237 243', 2: '247 21 171' };
/** Tail and head alpha per layer (far → near). */
const ALPHA: Array<[number, number]> = [
  [0.14, 0.28],
  [0.22, 0.45],
  [0.3, 0.68],
];
const WIDTH = [0.9, 1.3, 2];

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
    let droplets: Droplet[] = [];

    const drop = (anywhere: boolean): Drop => {
      const depth = 0.3 + Math.random() * 0.7;
      const r = Math.random();
      return {
        x: Math.random() * (w + h * 0.4) - h * 0.3,
        y: anywhere ? Math.random() * h : -Math.random() * h * 0.3,
        depth,
        layer: depth < 0.55 ? 0 : depth < 0.8 ? 1 : 2,
        len: (26 + Math.random() * 38) * depth,
        speed: (640 + Math.random() * 520) * (0.5 + depth * 0.65) * pace,
        tint: r < 0.16 ? 1 : r < 0.2 ? 2 : 0,
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(480, Math.max(180, (w * h) / 2400)) * (gentle ? 0.5 : 1));
      drops = Array.from({ length: count }, () => drop(true));
      splashes = [];
      droplets = [];
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    /** Gusts: two slow waves and an occasional swell, 0 (still) … ~1 (gusting). */
    const seed = Math.random() * 100;
    const wind = (t: number) => {
      if (gentle) return 0.2;
      const s = seed + t;
      const g = 0.5 + 0.3 * Math.sin(s * 0.21) + 0.2 * Math.sin(s * 0.67 + 1.3);
      const swell = Math.max(0, Math.sin(s * 0.093)) ** 6;
      return Math.max(0, Math.min(1.2, g * 0.7 + swell * 0.6));
    };

    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      // rAF's timestamp can predate the performance.now() taken at start: never step backwards.
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const gust = wind(now / 1000);
      const lean = LEAN + gust * 0.16;
      const hurry = 1 + gust * 0.25;

      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = 'round';

      // Tails first (long, faint), then heads (short, bright) over them; batched by layer and tint.
      for (const layer of [0, 1, 2] as const) {
        for (const tint of [0, 1, 2] as Tint[]) {
          const [tailA, headA] = ALPHA[layer];
          const tail = new Path2D();
          const head = new Path2D();
          let any = false;
          for (const d of drops) {
            if (d.layer !== layer || d.tint !== tint) continue;
            any = true;
            const dx = d.len * lean;
            tail.moveTo(d.x - dx * 0.3, d.y - d.len * 0.3);
            tail.lineTo(d.x - dx, d.y - d.len);
            head.moveTo(d.x, d.y);
            head.lineTo(d.x - dx * 0.35, d.y - d.len * 0.35);
          }
          if (!any) continue;
          const boost = tint === 0 ? 1 : 1.15;
          ctx.lineWidth = WIDTH[layer] * 0.8;
          ctx.strokeStyle = `rgb(${RGB[tint]} / ${Math.min(1, tailA * boost)})`;
          ctx.stroke(tail);
          ctx.lineWidth = WIDTH[layer];
          ctx.strokeStyle = `rgb(${RGB[tint]} / ${Math.min(1, headA * boost)})`;
          ctx.stroke(head);
        }
      }

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        const fall = d.speed * hurry * dt;
        d.y += fall;
        d.x += fall * lean;
        // Near drops land on the pavement (the lower part of the street); the rest fall past.
        const ground = h * (0.8 + (1 - d.depth) * 0.2);
        if (d.y >= ground || d.x > w + 40) {
          if (d.y >= ground && d.layer === 2 && splashes.length < 60) {
            splashes.push({ x: d.x, y: ground, age: 0, size: d.depth });
            if (!gentle && droplets.length < 140) {
              const n = 1 + Math.floor(Math.random() * 3);
              for (let k = 0; k < n; k++) {
                droplets.push({
                  x: d.x,
                  y: ground,
                  vx: (Math.random() * 2 - 1) * 70 + gust * 30,
                  vy: -(90 + Math.random() * 150) * d.depth,
                  age: 0,
                });
              }
            }
          }
          drops[i] = drop(false);
        }
      }

      // Splash: a crown that opens and fades, then a flat ripple on the wet pavement.
      ctx.lineWidth = 1;
      splashes = splashes.filter((s) => (s.age += dt) < RIPPLE_S);
      for (const s of splashes) {
        if (s.age < SPLASH_S) {
          const k = s.age / SPLASH_S;
          ctx.strokeStyle = `rgb(${RGB[0]} / ${0.65 * (1 - k)})`;
          ctx.beginPath();
          ctx.ellipse(s.x, s.y, (1.5 + k * 6) * s.size, (0.8 + k * 2.4) * s.size, 0, Math.PI, 2 * Math.PI);
          ctx.stroke();
        }
        const r = s.age / RIPPLE_S;
        ctx.strokeStyle = `rgb(${RGB[0]} / ${0.22 * (1 - r)})`;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y + 1, (3 + r * 14) * s.size, (0.7 + r * 2.2) * s.size, 0, 0, 2 * Math.PI);
        ctx.stroke();
      }

      ctx.fillStyle = `rgb(${RGB[0]} / 0.6)`;
      droplets = droplets.filter((p) => (p.age += dt) < DROPLET_S);
      for (const p of droplets) {
        p.vy += GRAVITY * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        ctx.globalAlpha = 1 - p.age / DROPLET_S;
        ctx.fillRect(p.x - 0.75, p.y - 0.75, 1.5, 1.5);
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
