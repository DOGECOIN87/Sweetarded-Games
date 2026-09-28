/**
 * The night window. One painting, several moments:
 *
 *   idle   ROOM 2  — only the bell does anything
 *   catch  ROOM 3B — cup on the tray, can on the floor, nothing else
 *   took   PATH A  — the cup comes back empty; the mat is the way out
 *   spit   PATH B  — the cup goes in the can
 *
 * The pad, the receipt and the bag are papers laid over this scene.
 */
import { COPY } from '../copy';
import { Hotspot } from '../Hotspot';
import { ART, COUNTER, PROPS } from '../scenes';
import { Speech } from '../Speech';
import { At, Stage } from '../Stage';
import { useLater } from '../useLater';

export type CounterMoment = 'idle' | 'papers' | 'catch' | 'took' | 'spit';

interface CounterProps {
  moment: CounterMoment;
  pan: boolean;
  /** The clerk's current line; `key` replays it. */
  line: { text: string; key: number } | null;
  /** Bumps each time the bell is rung, replaying the ring. */
  rings: number;
  onRing: () => void;
  onTake: () => void;
  onSpit: () => void;
  onLeave: () => void;
}

export function Counter({ moment, pan, line, rings, onRing, onTake, onSpit, onLeave }: CounterProps) {
  const bellNudge = useLater(4200, moment);
  const catchNudge = useLater(5200, moment);
  const exitReady = useLater(1900, moment);

  const cup = moment === 'catch' || moment === 'spit' ? PROPS.cupFull : moment === 'took' ? PROPS.cupEmpty : null;

  return (
    <Stage
      art={ART.counter}
      alt="Inside: a night window, COUNTER 4444. A pop-tart pharmacist watches through the glass. A bell on the tray, a vending machine of Sweetardios, a trash can full of pills."
      pan={pan}
      focusX={moment === 'catch' ? 1320 : 1100}
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
        <Hotspot
          r={COUNTER.bell}
          label={COPY.counter.bell}
          prop={PROPS.bell}
          placement="right"
          hint={bellNudge && rings === 0}
          onActivate={onRing}
        />
      )}

      {moment === 'idle' && <Hotspot r={COUNTER.vending} label={COPY.counter.vending} dead placement="right" />}

      {moment === 'catch' && (
        <>
          <Hotspot
            r={{ x: COUNTER.cup.x - 12, y: COUNTER.cup.y - 10, w: COUNTER.cup.w + 24, h: COUNTER.cup.h + 16 }}
            label={COPY.catch.cup}
            prop={PROPS.cupFull}
            placement="bottom"
            hint={catchNudge}
            onActivate={onTake}
          />
          <Hotspot r={COUNTER.trash} label={COPY.catch.can} prop={PROPS.trash} placement="left" hint={catchNudge} onActivate={onSpit} />
        </>
      )}

      {moment === 'took' && exitReady && (
        <Hotspot r={COUNTER.mat} label={COPY.pathA} hint onActivate={onLeave} className="rx-hotspot--exit" />
      )}

      {line && <Speech key={`line-${line.key}`} r={COUNTER.speech} text={line.text} />}
    </Stage>
  );
}
