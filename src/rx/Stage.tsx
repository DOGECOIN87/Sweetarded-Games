/**
 * Paintings and the things pinned to them.
 *
 * A Canvas is any locked painting laid out at some size; everything inside
 * it is placed with <At> in the painting's own pixels, so hotspots and props
 * stay glued to the art at every screen size. The Stage is the room: a
 * Canvas that fills the window.
 */
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import type { Painting, Rect } from './scenes';

const CanvasCtx = createContext<{ w: number; h: number }>({ w: 1, h: 1 });

const pct = (n: number) => `${(n * 100).toFixed(4)}%`;

export function rectStyle(r: Rect, w: number, h: number): CSSProperties {
  return {
    left: pct(r.x / w),
    top: pct(r.y / h),
    width: pct(r.w / w),
    height: pct(r.h / h),
    transform: r.rotate ? `rotate(${r.rotate}deg)` : undefined,
  };
}

type AtProps = { r: Rect } & HTMLAttributes<HTMLDivElement>;

/** Absolutely placed in the enclosing painting's pixels. */
export function At({ r, className = '', style, ...rest }: AtProps) {
  const { w, h } = useContext(CanvasCtx);
  return <div className={`rx-at ${className}`} style={{ ...rectStyle(r, w, h), ...style }} {...rest} />;
}

export function useCanvas() {
  return useContext(CanvasCtx);
}

/** A painting at whatever size its container gives it (width drives height). */
export function Canvas({
  art,
  alt,
  className = '',
  style,
  children,
  imgClassName = '',
}: {
  art: Painting;
  alt: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  imgClassName?: string;
}) {
  return (
    <CanvasCtx.Provider value={{ w: art.w, h: art.h }}>
      <div className={`rx-canvas ${className}`} style={{ aspectRatio: `${art.w} / ${art.h}`, ...style }}>
        <img className={`rx-canvas__art ${imgClassName}`} src={art.src} alt={alt} draggable={false} decoding="async" />
        {children}
      </div>
    </CanvasCtx.Provider>
  );
}

function useViewport() {
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

/** How much of a painting may be cropped off by full-bleed before we letterbox instead. */
const MAX_CROP = 0.16;

/**
 * The room. Full-bleed (cover) on desktop; letterboxed (contain) if cover
 * would crop too much of the painting. On a phone that walked in anyway the
 * painting fills the height and the patient has to drag across the room.
 */
export function Stage({
  art,
  alt,
  pan = false,
  focusX,
  className = '',
  children,
}: {
  art: Painting;
  alt: string;
  /** Phone mode: fill height, scroll sideways. */
  pan?: boolean;
  /** Painting x to centre on when panning. */
  focusX?: number;
  className?: string;
  children?: ReactNode;
}) {
  const vp = useViewport();
  const scrollRef = useRef<HTMLDivElement>(null);

  const cover = Math.max(vp.w / art.w, vp.h / art.h);
  const contain = Math.min(vp.w / art.w, vp.h / art.h);
  const panning = pan && vp.h > vp.w;
  let scale = cover;
  if (panning) scale = vp.h / art.h;
  else if (Math.min(vp.w / (art.w * cover), vp.h / (art.h * cover)) < 1 - MAX_CROP) scale = contain;

  const width = art.w * scale;
  const height = art.h * scale;

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !panning) return;
    const x = (focusX ?? art.w / 2) * scale - vp.w / 2;
    el.scrollLeft = Math.max(0, Math.min(x, width - vp.w));
  }, [panning, focusX, scale, width, vp.w, art.w]);

  const canvasStyle: CSSProperties = panning
    ? { width, height, left: 0, top: 0 }
    : { width, height, left: (vp.w - width) / 2, top: (vp.h - height) / 2 };

  return (
    <div ref={scrollRef} className={`rx-stage ${panning ? 'rx-stage--pan' : ''} ${className}`}>
      {panning && <div style={{ width, height: 1 }} aria-hidden />}
      <Canvas
        art={art}
        alt={alt}
        className="rx-stage__canvas"
        style={{ ...canvasStyle, ['--s' as string]: String(scale) }}
      >
        {children}
      </Canvas>
    </div>
  );
}
