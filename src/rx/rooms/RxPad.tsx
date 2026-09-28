/**
 * The Rx pad. One sheet, four places:
 *
 *   away   off the bottom of the screen
 *   peek   UNOPENED SCRIPT, slid under the window after the bell
 *   open   ROOM 3A — the intake, real controls in the printed boxes
 *   catch  ROOM 3B — handed back with the pharmacist's note on it
 *
 * Order on the pad, per the brief: identify (X, Google or email) → three questions → notes →
 * where we send the bag → side effects (collapsed) → SEND TO FILL.
 * The three questions have no printed box of their own, so they are asked
 * inside PHARMACIST NOTES, one at a time, before the sentence.
 */
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { COPY, QUESTIONS } from '../copy';
import { SIDE_EFFECT_LINKS } from '../config';
import { Hotspot } from '../Hotspot';
import {
  clearIdentityError,
  createEmailPatient,
  patientLabel,
  resetEmailPassword,
  signInWithEmail,
  signInWithGoogle,
  signInWithX,
  signOut,
  useIdentity,
} from '../identity';
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
  const [emailOpen, setEmailOpen] = useState(false);

  const patient = identity.status === 'in' ? identity.patient : null;
  useEffect(() => {
    if (patient) setEmailOpen(false);
  }, [patient]);
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
            <span className="rx-id__handle">{patientLabel(patient)}</span>
            <button type="button" className="rx-id__out" onClick={() => void signOut()} aria-label="Sign out">
              ×
            </button>
          </div>
        ) : (
          <div className="rx-id rx-id--out">
            <div className="rx-id__ways">
              <span className="rx-id__lead" aria-hidden>
                {COPY.pad.identify.lead}
              </span>
              <button
                type="button"
                className="rx-xbtn"
                aria-label="Sign in with X"
                onClick={() => void signInWithX()}
                disabled={identity.busy || identity.status === 'checking'}
              >
                <XMark />
                {COPY.pad.identify.x}
              </button>
              <button
                type="button"
                className="rx-xbtn"
                aria-label="Sign in with Google"
                onClick={() => void signInWithGoogle()}
                disabled={identity.busy || identity.status === 'checking'}
              >
                <GoogleMark />
                {COPY.pad.identify.google}
              </button>
              <button
                type="button"
                className="rx-xbtn"
                aria-label="Sign in with email"
                aria-expanded={emailOpen}
                onClick={() => {
                  clearIdentityError();
                  setEmailOpen(true);
                }}
                disabled={identity.status === 'checking'}
              >
                <MailMark />
                {COPY.pad.identify.email}
              </button>
            </div>
            {identity.errorCode && !emailOpen ? (
              <p className="rx-trouble" data-code={identity.errorCode} role="alert">
                {troubleFor(identity.errorCode)}
              </p>
            ) : (
              <p className="rx-helper">{COPY.pad.identify.helper}</p>
            )}
          </div>
        )}
      </At>
      {emailOpen && !patient && <EmailSlip onClose={() => setEmailOpen(false)} />}

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
  return (
    <>
      <At r={PAD.identify} className="rx-box rx-box--written">
        <p className="rx-written rx-written--name">{identity.patient ? patientLabel(identity.patient) : ''}</p>
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

/** Email and password: sign in, open a new file, or get a reset link. */
function EmailSlip({ onClose }: { onClose: () => void }) {
  const identity = useIdentity();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sent, setSent] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => emailRef.current?.focus({ preventScroll: true }), []);

  const signIn = (e: FormEvent) => {
    e.preventDefault();
    setSent(false);
    void signInWithEmail(email, password);
  };
  const create = () => {
    setSent(false);
    void createEmailPatient(email, password);
  };
  const forgot = async () => {
    setSent(false);
    if (await resetEmailPassword(email)) setSent(true);
  };

  return (
    <At r={PAD.slip} className="rx-slip">
      <form className="rx-slip__form" onSubmit={signIn} aria-label="Sign in with email">
        <input
          ref={emailRef}
          className="rx-slip__input"
          type="email"
          aria-label="Email"
          placeholder={COPY.pad.emailSlip.email}
          autoComplete="email"
          autoCapitalize="off"
          spellCheck={false}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="rx-slip__input"
          type="password"
          aria-label="Password"
          placeholder={COPY.pad.emailSlip.password}
          autoComplete="current-password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="rx-slip__actions">
          <button type="submit" className="rx-xbtn" disabled={identity.busy || !password}>
            {COPY.pad.emailSlip.signIn}
          </button>
          <button type="button" className="rx-xbtn rx-xbtn--ghost" disabled={identity.busy || !password} onClick={create}>
            {COPY.pad.emailSlip.create}
          </button>
          <button type="button" className="rx-slip__link" disabled={identity.busy || !email} onClick={() => void forgot()}>
            {COPY.pad.emailSlip.forgot}
          </button>
        </div>
        <p className={identity.errorCode ? 'rx-trouble' : 'rx-helper rx-helper--quiet'} role={identity.errorCode ? 'alert' : undefined}>
          {identity.errorCode ? troubleFor(identity.errorCode) : sent ? COPY.pad.emailSlip.sent : COPY.pad.identify.helper}
        </p>
      </form>
      <button type="button" className="rx-id__out rx-slip__close" onClick={onClose} aria-label="Close">
        ×
      </button>
    </At>
  );
}

/** Firebase Auth error code → the line the pad writes back. */
function troubleFor(code: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return COPY.trouble.emailWrong;
    case 'auth/email-already-in-use':
      return COPY.trouble.emailTaken;
    case 'auth/weak-password':
    case 'auth/missing-password':
      return COPY.trouble.emailWeak;
    case 'auth/invalid-email':
    case 'auth/missing-email':
      return COPY.trouble.emailBad;
    case 'auth/too-many-requests':
      return COPY.trouble.tooMany;
    case 'auth/operation-not-allowed':
    case 'auth/unauthorized-domain':
    case 'auth/configuration-not-found':
    case 'auth/admin-restricted-operation':
    case 'auth/unavailable':
      return COPY.trouble.closed;
    default:
      return COPY.trouble.signIn;
  }
}

function Tick({ on }: { on: boolean }) {
  return (
    <span className={`rx-tick ${on ? 'is-on' : ''}`} aria-hidden>
      {on ? '✓' : ''}
    </span>
  );
}

function GoogleMark() {
  return (
    <svg className="rx-xbtn__mark" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M21.35 11.1H12v2.98h5.35c-.23 1.43-1.66 4.2-5.35 4.2-3.22 0-5.85-2.67-5.85-5.96S8.78 6.36 12 6.36c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.68 3.8 14.55 2.85 12 2.85 6.95 2.85 2.85 6.95 2.85 12S6.95 21.15 12 21.15c5.28 0 8.78-3.71 8.78-8.94 0-.6-.07-1.06-.15-1.51z"
      />
    </svg>
  );
}

function MailMark() {
  return (
    <svg className="rx-xbtn__mark" viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" d="M3 5h18v14H3V5zm2 2v.3l7 4.7 7-4.7V7H5zm14 2.7-7 4.7-7-4.7V17h14V9.7z" />
    </svg>
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
