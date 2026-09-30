/**
 * The vending machine's screen and keypad, once a patient has spat them out.
 *
 * The screen shows the Telegram logo and is itself the link. The twelve pink
 * keys press, beep and type onto the screen; the counter's own number, 4444,
 * sends the plane off to Telegram. Any other four digits buzz and clear.
 *
 * The painted keys are a few pixels wide on a phone, so touch screens press
 * the keypad as a whole and get a close-up of it with keys a thumb can hit.
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { COPY } from '../copy';
import { Hotspot } from '../Hotspot';
import { COUNTER, KEY_PITCH } from '../scenes';
import { beep } from '../sfx';
import { At } from '../Stage';
import { TelegramMark } from '../TelegramMark';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'] as const;
const CODE = '4444';

type Screen = 'logo' | 'typing' | 'go' | 'no';

/** A new tab where allowed; in-app browsers that refuse pop-ups go there directly. */
function openOutside(href: string) {
  const tab = window.open(href, '_blank');
  if (tab) tab.opener = null;
  else window.location.assign(href);
}

function Lcd({ screen, typed }: { screen: Screen; typed: string }) {
  return (
    <>
      {screen === 'logo' || screen === 'go' ? (
        <TelegramMark className="rx-lcd__plane" />
      ) : (
        <span className="rx-lcd__digits">{screen === 'no' ? 'NO' : typed}</span>
      )}
    </>
  );
}

export function Vending({ href }: { href: string }) {
  const [typed, setTyped] = useState('');
  const [screen, setScreen] = useState<Screen>('logo');
  const [lit, setLit] = useState<{ key: string; n: number } | null>(null);
  const [closeup, setCloseup] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (!closeup) return undefined;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setCloseup(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeup]);

  const settle = (next: Screen, ms: number, after?: () => void) => {
    setScreen(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setTyped('');
      setScreen('logo');
      after?.();
    }, ms);
  };

  const check = (code: string) => {
    if (code === CODE) {
      openOutside(href);
      settle('go', 1400, () => setCloseup(false));
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
    else settle('typing', closeup ? 6000 : 2600);
  };

  const keyButton = (key: string, i: number, className: string) => (
    <button
      key={lit?.key === key ? `${key}-${lit.n}` : key}
      type="button"
      className={`${className} ${lit?.key === key ? 'is-lit' : ''}`}
      aria-label={key}
      onClick={() => press(key, i)}
    >
      {className === 'rx-closeup__key' ? key : null}
    </button>
  );

  return (
    <>
      <At r={COUNTER.lcd} className={`rx-lcd is-${screen}`} aria-hidden>
        <Lcd screen={screen} typed={typed} />
      </At>
      <span className="rx-sr" aria-live="polite">
        {screen === 'no' ? 'NO' : typed}
      </span>
      <Hotspot
        r={COUNTER.telegram}
        label={COPY.counter.refused.telegram}
        href={href}
        className="rx-hotspot--backroom rx-hotspot--telegram"
      />

      <div role="group" aria-label={COPY.counter.refused.keypad} className="rx-keys">
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
            {keyButton(key, i, 'rx-key__hit')}
          </At>
        ))}
      </div>
      <Hotspot
        r={COUNTER.keypad}
        label={COPY.counter.refused.keypad}
        onActivate={() => setCloseup(true)}
        className="rx-hotspot--backroom rx-keyzone"
      />

      {closeup &&
        createPortal(
          <div className="rx-closeup" onClick={() => setCloseup(false)}>
            <div
              className="rx-closeup__panel"
              role="dialog"
              aria-modal="true"
              aria-label={COPY.counter.refused.keypad}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`rx-lcd rx-closeup__lcd is-${screen}`} aria-hidden>
                <Lcd screen={screen} typed={typed} />
              </div>
              <div className="rx-closeup__keys">{KEYS.map((key, i) => keyButton(key, i, 'rx-closeup__key'))}</div>
              <button type="button" className="rx-closeup__close" onClick={() => setCloseup(false)}>
                {COPY.counter.refused.close}
              </button>
            </div>
          </div>,
          document.querySelector('.rx') ?? document.body,
        )}
    </>
  );
}
