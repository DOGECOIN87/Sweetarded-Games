/**
 * The Rx pad. One sheet, four places:
 *
 *   away   off the bottom of the screen
 *   peek   UNOPENED SCRIPT, slid under the window after the bell
 *   open   ROOM 3A — the intake, real controls in the printed boxes
 *   catch  ROOM 3B — handed back with the pharmacist's note on it
 *
 * Order on the pad, per the brief: identify (X) → three questions → notes →
 * where we send the bag → side effects (collapsed) → SEND TO FILL.
 * The three questions have no printed box of their own, so they are asked
 * inside PHARMACIST NOTES, one at a time, before the sentence.
 */
import { useEffect, useRef, useState } from 'react';
import { COPY, QUESTIONS } from '../copy';
import { SIDE_EFFECT_LINKS } from '../config';
import { Hotspot } from '../Hotspot';
import { signInWithX, signOutOfX, useIdentity } from '../identity';
import { isIntakeComplete, isSolanaAddress, updateProgress, useProgress } from '../progress';
import { ART, PAD } from '../scenes';
import { At, Canvas } from '../Stage';
import { useLater } from '../useLater';

export type PadPlace = 'away' | 'peek' | 'open' | 'catch';

interface RxPadProps {
  place: PadPlace;
  onOpen: () => void;
  onClose: () => void;
  onSend: () => void;
}

export function RxPad({ place, onOpen, onClose, onSend }: RxPadProps) {
  const peekNudge = useLater(900, place);
  const padRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (place === 'open') padRef.current?.focus({ preventScroll: true });
  }, [place]);

  useEffect(() => {
    if (place !== 'open') return undefined;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [place, onClose]);

  return (
    <>
      <div className={`rx-dim ${place === 'open' ? 'is-on' : ''}`} onClick={onClose} aria-hidden />
      <div
        ref={padRef}
        tabIndex={place === 'open' ? -1 : undefined}
        className={`rx-pad rx-pad--${place}`}
        role={place === 'open' ? 'dialog' : undefined}
        aria-modal={place === 'open' || undefined}
        aria-label={place === 'open' ? 'After Hours Rx prescription pad' : undefined}
        aria-hidden={place === 'away' || undefined}
      >
        <Canvas art={ART.pad} alt="" className="rx-pad__paper">
          {place === 'peek' && (
            <Hotspot
              r={{ x: 0, y: 0, w: ART.pad.w, h: 560 }}
              label={COPY.counter.unopened}
              hint={peekNudge}
              onActivate={onOpen}
              className="rx-hotspot--paper"
            />
          )}
          {place === 'open' && <Intake onSend={onSend} />}
          {place === 'catch' && <PharmacistNote />}
        </Canvas>
      </div>
    </>
  );
}

function Intake({ onSend }: { onSend: () => void }) {
  const progress = useProgress();
  const identity = useIdentity();
  const [editing, setEditing] = useState<number | null>(null);
  const [sideOpen, setSideOpen] = useState(false);
  const [walletTouched, setWalletTouched] = useState(false);
  const [flash, setFlash] = useState(0);
  const [pressed, setPressed] = useState(false);

  const patient = identity.status === 'in' ? identity.patient : null;
  const pending = QUESTIONS.findIndex((q) => !progress.answers[q.id]);
  const asking = editing ?? (pending >= 0 ? pending : null);
  const walletOk = isSolanaAddress(progress.wallet);
  const ready = Boolean(patient) && isIntakeComplete(progress);

  const missing = {
    identify: !patient,
    notes: pending >= 0 || !progress.notes.trim(),
    bag: !walletOk,
  };

  const send = () => {
    if (!ready) {
      setFlash((n) => n + 1);
      if (!walletOk) setWalletTouched(true);
      return;
    }
    setPressed(true);
    window.setTimeout(onSend, 420);
  };

  return (
    <>
      {/* 1 — IDENTIFY YOURSELF */}
      <At r={PAD.identify} className={`rx-box ${flash && missing.identify ? `is-missing-${flash % 2}` : ''}`}>
        {patient ? (
          <div className="rx-id">
            {patient.photo && <img className="rx-id__face" src={patient.photo} alt="" referrerPolicy="no-referrer" />}
            <span className="rx-id__handle">{patient.handle ? `@${patient.handle}` : patient.name ?? ''}</span>
            <button type="button" className="rx-id__out" onClick={() => void signOutOfX()} aria-label="Sign out of X">
              ×
            </button>
          </div>
        ) : (
          <div className="rx-id">
            <button
              type="button"
              className="rx-xbtn"
              onClick={() => void signInWithX()}
              disabled={identity.busy || identity.status === 'checking'}
            >
              <XMark />
              {COPY.pad.identify.button}
            </button>
            <p className="rx-helper">{COPY.pad.identify.helper}</p>
          </div>
        )}
        {identity.errorCode && (
          <p className="rx-trouble" data-code={identity.errorCode} role="alert">
            {COPY.trouble.signIn}
          </p>
        )}
      </At>

      {/* 2 + 3 — the three questions, then PHARMACIST NOTES */}
      <At r={PAD.notes} className={`rx-box ${flash && missing.notes ? `is-missing-${flash % 2}` : ''}`}>
        {asking !== null ? (
          <fieldset className="rx-q">
            <legend className="rx-q__ask">
              <span className="rx-q__step" aria-hidden>
                {QUESTIONS.map((q, i) => (
                  <i key={q.id} className={i === asking ? 'is-now' : progress.answers[q.id] ? 'is-done' : ''} />
                ))}
              </span>
              {QUESTIONS[asking].ask}
            </legend>
            <div className="rx-q__opts">
              {QUESTIONS[asking].options.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={progress.answers[QUESTIONS[asking].id] === option ? 'is-picked' : ''}
                  aria-pressed={progress.answers[QUESTIONS[asking].id] === option}
                  onClick={() => {
                    updateProgress((p) => ({ answers: { ...p.answers, [QUESTIONS[asking].id]: option } }));
                    setEditing(null);
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </fieldset>
        ) : (
          <div className="rx-notes">
            <div className="rx-notes__answers">
              {QUESTIONS.map((q, i) => (
                <button key={q.id} type="button" onClick={() => setEditing(i)} aria-label={`${q.ask} ${progress.answers[q.id]}`}>
                  {progress.answers[q.id]}
                </button>
              ))}
            </div>
            <textarea
              className="rx-notes__text"
              aria-label="Pharmacist notes"
              maxLength={COPY.pad.notes.max}
              placeholder={COPY.pad.notes.placeholder}
              value={progress.notes}
              onChange={(e) => updateProgress({ notes: e.target.value })}
              rows={2}
            />
            <span className="rx-notes__count" aria-hidden>
              {progress.notes.length}/{COPY.pad.notes.max}
            </span>
          </div>
        )}
      </At>

      {/* 4 — WHERE WE SEND THE BAG */}
      <At r={PAD.bagBox} className={`rx-box ${flash && missing.bag ? `is-missing-${flash % 2}` : ''}`}>
        <div className="rx-wallet">
          <input
            className="rx-wallet__input"
            aria-label="Where we send the bag — Solana wallet"
            placeholder={COPY.pad.bag.placeholder}
            value={progress.wallet}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            onChange={(e) => updateProgress({ wallet: e.target.value.trim() })}
            onBlur={() => setWalletTouched(true)}
          />
          <p className="rx-wallet__note">
            {walletTouched && progress.wallet && !walletOk ? (
              <span className="rx-trouble" role="alert">
                {COPY.trouble.wallet}
              </span>
            ) : (
              COPY.pad.bag.note
            )}
          </p>
        </div>
      </At>

      {/* 5 — SIDE EFFECTS, collapsed */}
      <At r={PAD.sideLabel} className="rx-side-toggle">
        <button type="button" aria-expanded={sideOpen} aria-controls="rx-side-list" onClick={() => setSideOpen((v) => !v)}>
          <span className="rx-sr">Side effects</span>
          <span className="rx-side-toggle__mark" aria-hidden>
            {sideOpen ? '−' : '+'}
          </span>
        </button>
      </At>
      <At r={PAD.sideList} className={`rx-side ${sideOpen ? 'is-open' : ''}`}>
        <ul id="rx-side-list" hidden={!sideOpen}>
          <li>
            <a
              href={SIDE_EFFECT_LINKS.follow}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => updateProgress((p) => ({ sideEffects: { ...p.sideEffects, follow: true } }))}
            >
              <Tick on={progress.sideEffects.follow} />
              {COPY.pad.sideEffects.follow}
            </a>
          </li>
          <li>
            <a
              href={SIDE_EFFECT_LINKS.like}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => updateProgress((p) => ({ sideEffects: { ...p.sideEffects, like: true } }))}
            >
              <Tick on={progress.sideEffects.like} />
              {COPY.pad.sideEffects.like}
            </a>
          </li>
          <li>
            <button
              type="button"
              aria-pressed={progress.sideEffects.later}
              onClick={() => updateProgress((p) => ({ sideEffects: { ...p.sideEffects, later: !p.sideEffects.later } }))}
            >
              <Tick on={progress.sideEffects.later} />
              {COPY.pad.sideEffects.later}
            </button>
          </li>
        </ul>
      </At>

      {/* 6 — SEND TO FILL: the printed stamp is the button */}
      <Hotspot
        r={PAD.send}
        label={COPY.pad.send}
        refusing={!ready}
        onActivate={send}
        className={`rx-send ${ready ? 'is-ready' : ''} ${pressed ? 'is-pressed' : ''}`}
      />
    </>
  );
}

/** ROOM 3B: the sheet comes back with the pharmacist's note on it. */
function PharmacistNote() {
  const identity = useIdentity();
  const handle = identity.patient?.handle;
  return (
    <>
      <At r={PAD.identify} className="rx-box rx-box--written">
        <p className="rx-written rx-written--name">{handle ? `@${handle}` : identity.patient?.name ?? ''}</p>
      </At>
      <At r={PAD.notes} className="rx-box rx-box--written">
        <p className="rx-written rx-written--note">
          {COPY.catch.pad.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
      </At>
    </>
  );
}

function Tick({ on }: { on: boolean }) {
  return (
    <span className={`rx-tick ${on ? 'is-on' : ''}`} aria-hidden>
      {on ? '✓' : ''}
    </span>
  );
}

function XMark() {
  return (
    <svg className="rx-xbtn__mark" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      />
    </svg>
  );
}
