/**
 * AFTER HOURS RX / COUNTER 4444 — the whole site.
 *
 * Four rooms and one catch. Nothing proceeds without the bell; nothing mints
 * without a name, a filled pad, and the pills in the trash.
 *
 *   street ──door──▶ counter ──bell──▶ (UNOPENED SCRIPT) ──▶ pad
 *   pad ──SEND TO FILL──▶ catch ──TAKE THEM──▶ took ──mat──▶ street
 *                               └─SPIT THEM OUT─▶ spit ──▶ bag (mint)
 *
 * Returning patients still walk in and ring; the window remembers them:
 * filed → straight to the catch, spat → straight to the bag.
 * The browser's back button walks you out to the street.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { safeSessionStorage } from '../utils/safeStorage';
import { COPY } from './copy';
import { Flicker } from './Flicker';
import { getIdentity, useIdentity } from './identity';
import { MintWindowProvider } from './mintWindow';
import { fileIntake, notePath, readFile } from './patientFile';
import { getProgress, isIntakeComplete, updateProgress, useProgress } from './progress';
import { Bag } from './rooms/Bag';
import { Counter, type CounterMoment } from './rooms/Counter';
import { Receipt, RefusedStamp } from './rooms/Papers';
import { PhoneGate, isPhoneish } from './rooms/PhoneGate';
import { RxPad, type PadPlace } from './rooms/RxPad';
import { Street } from './rooms/Street';
import { ding, primeBell, thud } from './sfx';
import { usePharmacySound } from './usePharmacySound';

type Room = 'street' | 'counter' | 'pad' | 'catch' | 'took' | 'spit' | 'bag';

const GATE_KEY = 'rx:entered-anyway';

export default function Pharmacy() {
  const [gated, setGated] = useState(() => isPhoneish() && !safeSessionStorage.getItem(GATE_KEY));
  const [room, setRoom] = useState<Room>('street');
  const [peek, setPeek] = useState(false);
  const [line, setLine] = useState<{ text: string; key: number } | null>(null);
  const [rings, setRings] = useState(0);
  const [dark, setDark] = useState(false);
  const [stamp, setStamp] = useState(false);
  const identity = useIdentity();
  const spat = useProgress().path === 'spit';
  usePharmacySound(gated ? null : room === 'street' ? 'street' : 'inside');

  const timers = useRef<number[]>([]);
  const ringTimer = useRef(0);
  const pushed = useRef(false);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  const clearLater = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    window.clearTimeout(ringTimer.current);
  }, []);
  useEffect(() => clearLater, [clearLater]);

  const say = useCallback((text: string) => setLine((l) => ({ text, key: (l?.key ?? 0) + 1 })), []);

  const go = useCallback((next: Room) => {
    if (next !== 'street' && !pushed.current) {
      window.history.pushState({ rx: true }, '');
      pushed.current = true;
    }
    setRoom(next);
  }, []);

  // Back button: you walk out onto the street. Your file stays.
  useEffect(() => {
    const onPop = () => {
      pushed.current = false;
      clearLater();
      setPeek(false);
      setLine(null);
      setStamp(false);
      setDark(false);
      setRoom('street');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [clearLater]);

  // A file opened on another browser counts here too.
  const uid = identity.patient?.uid;
  useEffect(() => {
    const patient = getIdentity().patient;
    if (!patient) return undefined;
    let live = true;
    void readFile(patient).then((file) => {
      if (!live || !file) return;
      const p = getProgress();
      const blank = !p.notes && !p.wallet && !Object.keys(p.answers).length;
      updateProgress({
        ...(blank ? { answers: file.answers, notes: file.notes, wallet: file.wallet } : null),
        filed: true,
        path: p.path === 'spit' || file.path === 'spit' ? 'spit' : (p.path ?? file.path),
        minted: p.minted || file.minted,
      });
    });
    return () => {
      live = false;
    };
  }, [uid]);

  const enterFromStreet = () => {
    primeBell();
    later(() => setDark(true), 360);
    later(() => {
      setPeek(false);
      setLine(null);
      setRings(0);
      go('counter');
      setDark(false);
    }, 820);
  };

  const ring = () => {
    ding();
    setRings((n) => n + 1);
    say(COPY.counter.afterBell);
    window.clearTimeout(ringTimer.current);
    ringTimer.current = window.setTimeout(() => {
      const p = getProgress();
      if (p.path === 'spit') {
        setLine(null);
        go('bag');
      } else if (p.filed && getIdentity().patient && isIntakeComplete(p)) {
        setLine(null);
        go('catch');
      } else {
        setPeek(true);
      }
    }, 1900);
  };

  const sendToFill = () => {
    const patient = getIdentity().patient;
    if (!patient || !isIntakeComplete(getProgress())) return;
    updateProgress({ filed: true });
    void fileIntake(patient, getProgress());
    thud();
    setPeek(false);
    setLine(null);
    go('catch');
  };

  const takeThem = () => {
    updateProgress({ path: 'took' });
    const patient = getIdentity().patient;
    if (patient) void notePath(patient, 'took');
    go('took');
    say(COPY.pathA);
  };

  const spitThemOut = () => {
    updateProgress({ path: 'spit' });
    const patient = getIdentity().patient;
    if (patient) void notePath(patient, 'spit');
    go('spit');
    later(() => {
      thud();
      setStamp(true);
    }, 760);
    later(() => say(COPY.pathB), 1150);
    later(() => {
      setStamp(false);
      setLine(null);
      go('bag');
    }, 3100);
  };

  const leave = () => {
    setLine(null);
    setDark(true);
    later(() => {
      go('street');
      setDark(false);
    }, 460);
  };

  const moment: CounterMoment =
    room === 'counter' ? 'idle' : room === 'catch' ? 'catch' : room === 'took' ? 'took' : room === 'spit' ? 'spit' : 'papers';
  const padPlace: PadPlace =
    room === 'pad' ? 'open' : room === 'catch' ? 'catch' : room === 'counter' && peek ? 'peek' : 'away';

  // The register is ~8 MB: start it at the catch, or as soon as a patient who already spat walks in.
  return (
    <MintWindowProvider warm={room === 'catch' || room === 'spit' || room === 'bag' || (spat && room !== 'street')}>
      <main className="rx">
        {room === 'street' ? (
          <Street key="street" onEnter={enterFromStreet} />
        ) : (
          <Counter
            moment={moment}
            line={line}
            rings={rings}
            onRing={ring}
            onTake={takeThem}
            onSpit={spitThemOut}
            onLeave={leave}
          />
        )}

        {room !== 'street' && (
          <>
            <RxPad place={padPlace} onOpen={() => go('pad')} onClose={() => go('counter')} onSend={sendToFill} />
            <Receipt shown={room === 'took'} />
          </>
        )}

        {stamp && <RefusedStamp />}

        {room === 'bag' && (
          <>
            <div className="rx-dim is-on is-deep" aria-hidden />
            <Bag />
          </>
        )}

        <Flicker sound={!gated} />

        <div className={`rx-fade ${dark ? 'is-on' : ''}`} aria-hidden />

        {gated && (
          <PhoneGate
            onEnter={() => {
              safeSessionStorage.setItem(GATE_KEY, '1');
              setGated(false);
            }}
          />
        )}
      </main>
    </MintWindowProvider>
  );
}
