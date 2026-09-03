/* Arcade identity control — the games' replacement for a wallet button. */

import { useEffect, useRef, useState } from 'react';
import {
  getLocalPlayer,
  setPlayerName,
  getArcadeCode,
  restoreArcadeCode,
} from '../lib/playerIdentity';

interface PlayerChipProps {
  /** Called after the handle changes, so the host can re-key its saves. */
  onIdentityChange?: () => void;
  className?: string;
}

/**
 * Shows the player's arcade handle and lets them rename it or move it to
 * another device.
 *
 * Nothing in the arcade costs anything, so the games ask for a name rather
 * than a wallet. That name is the leaderboard row key; the arcade code below
 * it is the only way to carry that row to another browser, since the handle
 * otherwise lives and dies with this device's localStorage.
 */
const PlayerChip = ({ onIdentityChange, className = '' }: PlayerChipProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(() => getLocalPlayer().name);
  const [draft, setDraft] = useState(name);
  const [code, setCode] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const flash = (msg: string) => {
    setNote(msg);
    setTimeout(() => setNote(null), 2500);
  };

  const saveName = () => {
    const trimmed = draft.trim().slice(0, 24);
    if (!trimmed || trimmed === name) return;
    setPlayerName(trimmed);
    setName(trimmed);
    onIdentityChange?.();
    flash('Name saved');
  };

  const copyCode = async () => {
    const value = getArcadeCode();
    try {
      await navigator.clipboard.writeText(value);
      flash('Code copied');
    } catch {
      // Clipboard is blocked in plenty of contexts — show it to copy by hand.
      setCode(value);
      flash('Copy it from the box');
    }
  };

  const restore = () => {
    const restored = restoreArcadeCode(code);
    if (!restored) {
      flash("That code doesn't look right");
      return;
    }
    setName(restored.name);
    setDraft(restored.name);
    setCode('');
    onIdentityChange?.();
    flash('Handle restored');
  };

  return (
    <div className={`relative ${className}`} ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group flex items-center gap-2 border border-sweetardios-cyan/30 bg-black/70 px-3 py-1.5 transition-colors hover:border-sweetardios-cyan/70"
      >
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sweetardios-cyan shadow-[0_0_6px_#34EDF3]" />
        <span className="font-heading text-[10px] font-bold uppercase tracking-[0.15em] text-sweetardios-cyan group-hover:text-white">
          {name}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 border border-sweetardios-cyan/30 bg-black/95 p-4 shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur">
          <p className="mb-3 text-[11px] leading-relaxed text-blue-100/55">
            Everything here is free to play. Your scores are saved under this
            handle — no wallet needed.
          </p>

          <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.22em] text-sweetardios-cyan/70">
            Arcade handle
          </label>
          <div className="mb-4 flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveName()}
              maxLength={24}
              className="min-w-0 flex-1 border border-white/15 bg-white/[0.04] px-2 py-1.5 font-mono text-xs text-white outline-none focus:border-sweetardios-cyan/60"
            />
            <button
              type="button"
              onClick={saveName}
              className="shrink-0 border border-sweetardios-cyan/40 px-3 text-[10px] font-bold uppercase tracking-widest text-sweetardios-cyan transition-colors hover:bg-sweetardios-cyan/15"
            >
              Save
            </button>
          </div>

          <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.22em] text-sweetardios-cerise/70">
            Play on another device
          </label>
          <p className="mb-2 text-[10px] leading-relaxed text-blue-100/45">
            Copy your code, then paste it on your phone to keep the same spot on
            the board.
          </p>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="paste a code…"
              className="min-w-0 flex-1 border border-white/15 bg-white/[0.04] px-2 py-1.5 font-mono text-[11px] text-white outline-none placeholder:text-white/25 focus:border-sweetardios-cerise/60"
            />
            <button
              type="button"
              onClick={code.trim() ? restore : copyCode}
              className="shrink-0 border border-sweetardios-cerise/40 px-3 text-[10px] font-bold uppercase tracking-widest text-sweetardios-cerise transition-colors hover:bg-sweetardios-cerise/15"
            >
              {code.trim() ? 'Use' : 'Copy'}
            </button>
          </div>

          {note && <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-sweetardios-cyan">{note}</p>}
        </div>
      )}
    </div>
  );
};

export default PlayerChip;
