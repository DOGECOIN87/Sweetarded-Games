/** A line from behind the glass, typed out. One line at a time. */
import { useEffect, useRef, useState } from 'react';
import { At } from './Stage';
import type { Rect } from './scenes';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Speech({ r, text, onDone }: { r: Rect; text: string; onDone?: () => void }) {
  const [shown, setShown] = useState(() => (reducedMotion() ? text.length : 0));
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    if (reducedMotion()) {
      setShown(text.length);
      done.current?.();
      return undefined;
    }
    setShown(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= text.length) {
        window.clearInterval(id);
        done.current?.();
      }
    }, 42);
    return () => window.clearInterval(id);
  }, [text]);

  return (
    <At r={r} className="rx-speech">
      <p>
        <span className="rx-sr">{text}</span>
        <span aria-hidden>
          {text.slice(0, shown)}
          <span className="rx-speech__caret" />
        </span>
      </p>
    </At>
  );
}
