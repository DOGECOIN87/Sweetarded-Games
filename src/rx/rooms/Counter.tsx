/**
 * The night window. One painting, several moments:
 *
 *   idle   ROOM 2  — only the bell does anything
 *   catch  ROOM 3B — cup on the tray, can on the floor, nothing else
 *   took   PATH A  — the cup comes back empty; the mat is the way out
 *   spit   PATH B  — the cup goes in the can
 *
 * Once a patient has spat them out, the idle window hides two back rooms in
 * the painting: the vending machine's screen and keypad (Telegram, see Vending)
 * and REFUSED WELCOME (a neon Discord logo).
 *
 * The pad, the receipt and the bag are papers laid over this scene.
 */
import { REFUSED_LINKS } from '../config';
import { COPY } from '../copy';
import { DiscordMark } from '../DiscordMark';
import { Hotspot } from '../Hotspot';
import { ART, COUNTER, FOCUS, KEEP, PROPS } from '../scenes';
import { Speech } from '../Speech';
import { At, Stage } from '../Stage';
import { useLater } from '../useLater';
import { Vending } from './Vending';

export type CounterMoment = 'idle' | 'papers' | 'catch' | 'took' | 'spit';

interface CounterProps {
  moment: CounterMoment;
  /** The clerk's current line; `key` replays it. */
  line: { text: string; key: number } | null;
  /** Bumps each time the bell is rung, replaying the ring. */
  rings: number;
  /** This patient spat them out: the back rooms are open. */
  refused: boolean;
  onRing: () => void;
  onTake: () => void;
  onSpit: () => void;
  onLeave: () => void;
}

export function Counter({ moment, line, rings, refused, onRing, onTake, onSpit, onLeave }: CounterProps) {
  const bellNudge = useLater(4200, moment);
  const catchNudge = useLater(5200, moment);
  const exitReady = useLater(1900, moment);

  const cup = moment === 'catch' || moment === 'spit' ? PROPS.cupFull : moment === 'took' ? PROPS.cupEmpty : null;
  const focus =
    moment === 'catch' || moment === 'spit' ? FOCUS.catch : moment === 'took' ? FOCUS.took : FOCUS.counter;

  return (
    <Stage
      art={ART.counter}
      alt="Inside: a night window, COUNTER 4444. A pop-tart pharmacist watches through the glass. A bell on the tray, a vending machine of Sweetardios, a trash can full of pills."
      focus={focus}
      keep={moment === 'catch' || moment === 'spit' ? KEEP.catch : undefined}
      className={`rx-counter rx-counter--${moment}`}
    >
      {cup && (
        <>
          <At r={COUNTER.cupShadow} className="rx-cup-shadow" />
          <At r={COUNTER.cup} className={`rx-cup ${moment === 'spit' ? 'is-spat' : ''}`}>
            <img src={cup} alt="" draggable={false} />
          </At>
        </>
      )}

      {rings > 0 && moment === 'idle' && (
        <At key={`ring-${rings}`} r={COUNTER.bellPop} className="rx-bell-pop" aria-hidden>
          <img src={PROPS.bell} alt="" draggable={false} />
        </At>
      )}

      {moment === 'idle' && (
        <>
          <Hotspot r={COUNTER.bell} label={COPY.counter.bell} hint={bellNudge && rings === 0} onActivate={onRing} />
          <Hotspot r={COUNTER.vending} label={COPY.counter.vending} dead />
          {refused && REFUSED_LINKS.telegram && <Vending href={REFUSED_LINKS.telegram} />}
          {refused && REFUSED_LINKS.discord && (
            <>
              <At r={COUNTER.discordNeon} className="rx-neon" aria-hidden>
                <DiscordMark className="rx-neon__logo" />
              </At>
              <Hotspot
                r={COUNTER.refusedSign}
                label={COPY.counter.refused.sign}
                href={REFUSED_LINKS.discord}
                className="rx-hotspot--backroom rx-hotspot--discord"
              />
            </>
          )}
        </>
      )}

      {moment === 'catch' && (
        <>
          <Hotspot
            r={{ x: COUNTER.cup.x - 12, y: COUNTER.cup.y - 10, w: COUNTER.cup.w + 24, h: COUNTER.cup.h + 16 }}
            label={COPY.catch.cup}
            hint={catchNudge}
            onActivate={onTake}
          />
          <Hotspot r={COUNTER.trash} label={COPY.catch.can} hint={catchNudge} onActivate={onSpit} />
        </>
      )}

      {moment === 'took' && exitReady && (
        <Hotspot r={COUNTER.mat} label={COPY.pathA} hint onActivate={onLeave} className="rx-hotspot--exit" />
      )}

      {line && <Speech key={`line-${line.key}`} r={COUNTER.speech} text={line.text} />}
    </Stage>
  );
}
