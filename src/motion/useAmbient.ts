import { useEffect } from 'react';

/**
 * Landing atmosphere driver.
 * - Reveals: every `.sw-reveal` element rises in once when it enters the
 *   viewport (children stagger via the `--rv-i` CSS variable).
 * - Hue wash: writes scroll progress (0..1) to the `.sw-wash` layer so the
 *   air shifts cerise near the door to cyan deep in the shop.
 * Under prefers-reduced-motion everything is shown immediately, fully lit.
 */
export function useAmbient() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = Array.from(document.querySelectorAll<HTMLElement>('.sw-reveal'));

    let io: IntersectionObserver | null = null;
    const pending = new Set<HTMLElement>();
    if (reduced || typeof IntersectionObserver === 'undefined') {
      targets.forEach((el) => el.classList.add('is-in'));
    } else {
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-in');
              pending.delete(entry.target as HTMLElement);
              io?.unobserve(entry.target);
            }
          }
        },
        { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
      );
      targets.forEach((el) => {
        pending.add(el);
        io?.observe(el);
      });
    }

    const wash = document.querySelector<HTMLElement>('.sw-wash');
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        wash?.style.setProperty('--scroll-p', p.toFixed(3));
        /* Instant jumps (anchors, End key) can skip the observer: anything
           now above the viewport has been "walked past" — light it. */
        for (const el of pending) {
          if (el.getBoundingClientRect().bottom < 0) {
            el.classList.add('is-in');
            io?.unobserve(el);
            pending.delete(el);
          }
        }
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
      io?.disconnect();
    };
  }, []);
}
