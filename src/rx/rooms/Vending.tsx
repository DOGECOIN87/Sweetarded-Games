/**
 * The vending machine's screen and keypad, once a patient has spat them out.
 *
 * The screen shows the Telegram logo and is itself the link. The twelve pink
 * keys press, beep and type onto the screen; the counter's own number, 4444,
 * sends the plane off to Telegram. Any other four digits buzz and clear.
 */
import { useEffect, useRef, useState } from 'react';
import { COPY } from '../copy';
import { Hotspot } from '../Hotspot';
import { COUNTER, KEY_PITCH } from '../scenes';
import { beep } from '../sfx';
import { At } from '../Stage';
import { TelegramMark } from '../TelegramMark';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'] as const;
const CODE = '4444';

type Screen = 'logo' | 'typing' | 'go' | 'no';

export function Vending({ href }: { href: string }) {
  const [typed, setTyped] = useState('');
  const [screen, setScreen] = useState<Screen>('logo');
  const [lit, setLit] = useState<{ key: string; n: number } | null>(null);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const settle = (next: Screen, ms: number) => {
    setScreen(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setTyped('');
      setScreen('logo');
    }, ms);
  };

  const check = (code: string) => {
    if (code === CODE) {
      window.open(href, '_blank', 'noopener,noreferrer');
      settle('go', 1400);
    } else {
      beep(0, true);
      settle('no', 900);
    }
  };

  const press = (key: string, i: number) => {
    setLit((l) => ({ key, n: (l?.n ?? 0) + 1 }));
    if (screen === 'go' || screen === 'no') return;
    beep(i);
    if (key === '*') return settle('logo', 0);
    if (key === '#') return check(typed);
    const code = typed + key;
    setTyped(code);
    if (code.length === CODE.length) check(code);
    else settle('typing', 2600);
  };

  return (
    <>
      <At r={COUNTER.lcd} className={`rx-lcd is-${screen}`} aria-hidden>
        {screen === 'logo' || screen === 'go' ? (
          <TelegramMark className="rx-lcd__plane" />
        ) : (
          <span className="rx-lcd__digits">{screen === 'no' ? 'NO' : typed}</span>
        )}
      </At>
      <Hotspot
        r={COUNTER.telegram}
        label={COPY.counter.refused.telegram}
        href={href}
        className="rx-hotspot--backroom rx-hotspot--telegram"
      />
      <div role="group" aria-label={COPY.counter.refused.keypad}>
        {KEYS.map((key, i) => (
          <At
            key={key}
            r={{
              ...COUNTER.key,
              x: COUNTER.key.x + (i % 3) * KEY_PITCH.x,
              y: COUNTER.key.y + Math.floor(i / 3) * KEY_PITCH.y,
            }}
            className="rx-key"
          >
            <button
              key={lit?.key === key ? lit.n : 0}
              type="button"
              className={`rx-key__hit ${lit?.key === key ? 'is-lit' : ''}`}
              aria-label={key}
              onClick={() => press(key, i)}
            />
          </At>
        ))}
      </div>
    </>
  );
}
