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
 *
 * On phones the boxes show what's written and open a sheet to write it.
 */
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { COPY, QUESTIONS } from '../copy';
import { SIDE_EFFECT_LINKS } from '../config';
import { isWalletBlocked } from '../device';
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

/**
 * Phones: the paper is too small to write on (under ~560 px wide: 0.75 ×
 * min(94dvh, 128vw)), so each printed box opens a sheet of the same paper
 * with the same controls at thumb size. The paper itself stays the scene.
 */
const COMPACT = '(max-width: 583px), (pointer: coarse) and (max-height: 794px)';

function useCompact(): boolean {
  const [on, setOn] = useState(() => window.matchMedia(COMPACT).matches);
  useEffect(() => {
    const mq = window.matchMedia(COMPACT);
    const onChange = () => setOn(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return on;
}

export function RxPad({ place, onOpen, onClose, onSend }: RxPadProps) {
  const peekNudge = useLater(900, place);
  const padRef = useRef<HTMLDivElement>(null);
  const compact = useCompact();

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
        className={`rx-pad rx-pad--${place} ${compact ? 'is-compact' : ''}`}
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
          {place === 'open' && <Intake compact={compact} onSend={onSend} />}
          {place === 'catch' && <PharmacistNote />}
        </Canvas>
      </div>
    </>
  );
}

type Section = keyof typeof COPY.pad.boxes;

function Intake({ compact, onSend }: { compact: boolean; onSend: () => void }) {
  const progress = useProgress();
  const identity = useIdentity();
  const [editing, setEditing] = useState<number | null>(null);
  const [sideOpen, setSideOpen] = useState(false);
  const [walletTouched, setWalletTouched] = useState(false);
  const [flash, setFlash] = useState(0);
  const [pressed, setPressed] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [sheet, setSheet] = useState<Section | null>(null);
  const [walletBlocked] = useState(isWalletBlocked);

  const patient = identity.status === 'in' ? identity.patient : null;
  useEffect(() => {
    if (!patient) return;
    setEmailOpen(false);
    setSheet((open) => (open === 'identify' ? null : open));
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
  const next: Section | null = missing.identify ? 'identify' : missing.notes ? 'notes' : missing.bag ? 'bag' : null;

  const send = () => {
    if (!ready) {
      setFlash((n) => n + 1);
      if (!walletOk) setWalletTouched(true);
      if (compact) setSheet(next);
      return;
    }
    setPressed(true);
    window.setTimeout(onSend, 420);
  };

  const box = (isMissing: boolean) => `rx-box ${flash && isMissing ? `is-missing-${flash % 2}` : ''}`;
  const openEmail = () => {
    clearIdentityError();
    setEmailOpen(true);
  };
  const walletNote = walletBlocked ? COPY.inApp.join(' ') : COPY.pad.bag.note;

  const ways = <IdentifyWays emailOpen={emailOpen} onEmail={openEmail} />;
  const notes = <NotesControls asking={asking} onAnswered={() => setEditing(null)} onEdit={setEditing} />;
  const wallet = (
    <WalletControls
      note={walletNote}
      showTrouble={walletTouched && Boolean(progress.wallet) && !walletOk}
      onTouched={() => setWalletTouched(true)}
    />
  );

  return (
    <>
      {/* 1 — IDENTIFY YOURSELF */}
      <At r={PAD.identify} className={box(missing.identify)}>
        {patient ? (
          <div className="rx-id">
            {patient.photo && <img className="rx-id__face" src={patient.photo} alt="" referrerPolicy="no-referrer" />}
            <span className="rx-id__handle">{patientLabel(patient)}</span>
            <button type="button" className="rx-id__out" onClick={() => void signOut()} aria-label="Sign out">
              ×
            </button>
          </div>
        ) : compact ? (
          <SheetOpener label={`${COPY.pad.boxes.identify}: sign in with X, Google or email`} hint={next === 'identify'} onOpen={() => setSheet('identify')}>
            <span className="rx-id rx-id--out">
              <span className="rx-id__ways">
                <span className="rx-id__lead">{COPY.pad.identify.lead}</span>
                <span className="rx-xbtn">
                  <XMark />
                  {COPY.pad.identify.x}
                </span>
                <span className="rx-xbtn">
                  <GoogleMark />
                  {COPY.pad.identify.google}
                </span>
                <span className="rx-xbtn">
                  <MailMark />
                  {COPY.pad.identify.email}
                </span>
              </span>
            </span>
          </SheetOpener>
        ) : (
          ways
        )}
      </At>
      {emailOpen && !patient && !compact && (
        <At r={PAD.slip} className="rx-slip">
          <EmailForm />
          <button type="button" className="rx-id__out rx-slip__close" onClick={() => setEmailOpen(false)} aria-label="Close">
            ×
          </button>
        </At>
      )}

      {/* 2 + 3 — the three questions, then PHARMACIST NOTES */}
      <At r={PAD.notes} className={box(missing.notes)}>
        {compact ? (
          <SheetOpener label={COPY.pad.boxes.notes} hint={next === 'notes'} onOpen={() => setSheet('notes')}>
            {asking !== null ? (
              <>
                <span className="rx-q__ask">{QUESTIONS[asking].ask}</span>
                <span className="rx-sum">{QUESTIONS[asking].options.join(' · ')}</span>
              </>
            ) : (
              <>
                <span className="rx-sum rx-sum--answers">{QUESTIONS.map((q) => progress.answers[q.id]).join(' · ')}</span>
                <span className={`rx-sum ${progress.notes ? '' : 'rx-sum--empty'}`}>{progress.notes || COPY.pad.notes.placeholder}</span>
              </>
            )}
          </SheetOpener>
        ) : (
          notes
        )}
      </At>

      {/* 4 — WHERE WE SEND THE BAG */}
      <At r={PAD.bagBox} className={box(missing.bag)}>
        {compact ? (
          <SheetOpener label={COPY.pad.boxes.bag} hint={next === 'bag'} onOpen={() => setSheet('bag')}>
            <span className={`rx-sum rx-sum--wallet ${progress.wallet ? '' : 'rx-sum--empty'}`}>
              {progress.wallet || COPY.pad.bag.placeholder}
            </span>
            <span className="rx-wallet__note">{walletNote}</span>
          </SheetOpener>
        ) : (
          wallet
        )}
      </At>

      {/* 5 — SIDE EFFECTS, collapsed */}
      <At r={PAD.sideLabel} className="rx-side-toggle">
        <button
          type="button"
          aria-expanded={compact ? sheet === 'side' : sideOpen}
          aria-controls={compact ? undefined : 'rx-side-list'}
          onClick={() => (compact ? setSheet('side') : setSideOpen((v) => !v))}
        >
          <span className="rx-sr">Side effects</span>
          <span className="rx-side-toggle__mark" aria-hidden>
            {sideOpen && !compact ? '−' : '+'}
          </span>
        </button>
      </At>
      {!compact && (
        <At r={PAD.sideList} className={`rx-side ${sideOpen ? 'is-open' : ''}`}>
          <SideEffects id="rx-side-list" hidden={!sideOpen} />
        </At>
      )}

      {/* 6 — SEND TO FILL: the printed stamp is the button */}
      <Hotspot
        r={PAD.send}
        label={COPY.pad.send}
        refusing={!ready}
        onActivate={send}
        className={`rx-send ${ready ? 'is-ready' : ''} ${pressed ? 'is-pressed' : ''}`}
      />

      {compact && sheet && (
        <Sheet title={COPY.pad.boxes[sheet]} onClose={() => setSheet(null)}>
          {sheet === 'identify' && (patient ? null : emailOpen ? <EmailForm /> : ways)}
          {sheet === 'notes' && notes}
          {sheet === 'bag' && wallet}
          {sheet === 'side' && (
            <div className="rx-side is-open">
              <SideEffects />
            </div>
          )}
        </Sheet>
      )}
    </>
  );
}

/** A whole printed box as one button (phones): shows what's written, opens the sheet. */
function SheetOpener({
  label,
  hint,
  onOpen,
  children,
}: {
  label: string;
  hint: boolean;
  onOpen: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" className={`rx-box__open ${hint ? 'is-hint' : ''}`} aria-label={label} onClick={onOpen}>
      {children}
    </button>
  );
}

/** A slip of the same paper over the top of the screen, clear of the keyboard. */
function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return createPortal(
    <>
      <div className="rx-sheet-dim" onClick={onClose} aria-hidden />
      <div className="rx-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <p className="rx-sheet__title">{title}</p>
        {children}
        <button type="button" className="rx-xbtn rx-sheet__done" onClick={onClose}>
          {COPY.pad.done}
        </button>
        <button type="button" className="rx-id__out rx-sheet__close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
    </>,
    document.body,
  );
}

function IdentifyWays({ emailOpen, onEmail }: { emailOpen: boolean; onEmail: () => void }) {
  const identity = useIdentity();
  const waiting = identity.busy || identity.status === 'checking';
  return (
    <div className="rx-id rx-id--out">
      <div className="rx-id__ways">
        <span className="rx-id__lead" aria-hidden>
          {COPY.pad.identify.lead}
        </span>
        <button type="button" className="rx-xbtn" aria-label="Sign in with X" onClick={() => void signInWithX()} disabled={waiting}>
          <XMark />
          {COPY.pad.identify.x}
        </button>
        <button
          type="button"
          className="rx-xbtn"
          aria-label="Sign in with Google"
          onClick={() => void signInWithGoogle()}
          disabled={waiting}
        >
          <GoogleMark />
          {COPY.pad.identify.google}
        </button>
        <button
          type="button"
          className="rx-xbtn"
          aria-label="Sign in with email"
          aria-expanded={emailOpen}
          onClick={onEmail}
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
  );
}

/** The three questions one at a time, then the answers and the sentence. */
function NotesControls({
  asking,
  onAnswered,
  onEdit,
}: {
  asking: number | null;
  onAnswered: () => void;
  onEdit: (i: number) => void;
}) {
  const progress = useProgress();
  if (asking !== null) {
    const q = QUESTIONS[asking];
    return (
      <fieldset className="rx-q">
        <legend className="rx-q__ask">
          <span className="rx-q__step" aria-hidden>
            {QUESTIONS.map((other, i) => (
              <i key={other.id} className={i === asking ? 'is-now' : progress.answers[other.id] ? 'is-done' : ''} />
            ))}
          </span>
          {q.ask}
        </legend>
        <div className="rx-q__opts">
          {q.options.map((option) => (
            <button
              key={option}
              type="button"
              className={progress.answers[q.id] === option ? 'is-picked' : ''}
              aria-pressed={progress.answers[q.id] === option}
              onClick={() => {
                updateProgress((p) => ({ answers: { ...p.answers, [q.id]: option } }));
                onAnswered();
              }}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>
    );
  }
  return (
    <div className="rx-notes">
      <div className="rx-notes__answers">
        {QUESTIONS.map((q, i) => (
          <button key={q.id} type="button" onClick={() => onEdit(i)} aria-label={`${q.ask} ${progress.answers[q.id]}`}>
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
  );
}

function WalletControls({ note, showTrouble, onTouched }: { note: string; showTrouble: boolean; onTouched: () => void }) {
  const progress = useProgress();
  return (
    <div className="rx-wallet">
      <input
        className="rx-wallet__input"
        aria-label="Where we send the bag — Solana wallet"
        placeholder={COPY.pad.bag.placeholder}
        value={progress.wallet}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        inputMode="text"
        enterKeyHint="done"
        onChange={(e) => updateProgress({ wallet: e.target.value.trim() })}
        onBlur={onTouched}
      />
      <p className="rx-wallet__note">
        {showTrouble ? (
          <span className="rx-trouble" role="alert">
            {COPY.trouble.wallet}
          </span>
        ) : (
          note
        )}
      </p>
    </div>
  );
}

function SideEffects({ id, hidden = false }: { id?: string; hidden?: boolean }) {
  const progress = useProgress();
  return (
    <ul id={id} hidden={hidden}>
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
function EmailForm() {
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
    case 'auth/popup-blocked':
    case 'auth/operation-not-supported-in-this-environment':
    case 'auth/web-storage-unsupported':
      return isWalletBlocked() ? COPY.inApp.join(' ') : COPY.trouble.popup;
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
