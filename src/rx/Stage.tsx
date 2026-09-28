/**
 * Paintings and the things pinned to them.
 *
 * A Canvas is any locked painting laid out at some size; everything inside
 * it is placed with <At> in the painting's own pixels, so hotspots and props
 * stay glued to the art at every screen size. The Stage is the room: a
 * Canvas that always covers the window.
 */
import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from 'react';
import type { Painting, Point, Rect } from './scenes';

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

/** The element's own box (what the room actually has to cover), kept current. */
function useBox(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = () =>
      setSize((s) => (s.w === el.clientWidth && s.h === el.clientHeight ? s : { w: el.clientWidth, h: el.clientHeight }));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

/**
 * The room. The painting always covers the whole window, at every size and
 * orientation. Whatever doesn't fit can be dragged (or scrolled) into view;
 * `focus` is the painting point to keep centred, and moving it glides there.
 */
export function Stage({
  art,
  alt,
  focus,
  className = '',
  children,
}: {
  art: Painting;
  alt: string;
  /** Painting point to centre in the window. Defaults to the middle. */
  focus?: Point;
  className?: string;
  children?: ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const vp = useBox(scrollRef);
  const lastFocus = useRef<string | null>(null);

  const scale = Math.max(vp.w / art.w, vp.h / art.h);
  const width = Math.ceil(art.w * scale);
  const height = Math.ceil(art.h * scale);
  const fx = focus?.x ?? art.w / 2;
  const fy = focus?.y ?? art.h / 2;

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const left = Math.max(0, Math.min(fx * scale - vp.w / 2, width - vp.w));
    const top = Math.max(0, Math.min(fy * scale - vp.h / 2, height - vp.h));
    const key = `${fx},${fy}`;
    // Glide when the moment moves the focus; jump on first paint and resize.
    const glide =
      lastFocus.current !== null &&
      lastFocus.current !== key &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    lastFocus.current = key;
    el.scrollTo({ left, top, behavior: glide ? 'smooth' : 'auto' });
  }, [fx, fy, scale, width, height, vp.w, vp.h]);

  return (
    <div ref={scrollRef} className={`rx-stage ${className}`}>
      <Canvas art={art} alt={alt} className="rx-stage__canvas" style={{ width, height, ['--s' as string]: String(scale) }}>
        {children}
      </Canvas>
    </div>
  );
}
