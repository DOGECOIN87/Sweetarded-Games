import React, { useEffect, useRef, useState } from 'react';

/**
 * Site background music (Mattrick Remix). Browsers block autoplay until the
 * first user gesture, so we arm a one-shot listener to start playback on the
 * first click/keypress, plus a floating toggle to mute/unmute.
 */
/** Pause every other <audio> on the page so two sources never overlap. */
const pauseOtherAudio = (except: HTMLAudioElement | null) => {
  document.querySelectorAll('audio').forEach((el) => {
    if (el !== except && !el.paused) el.pause();
  });
};

const SiteMusic: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play().then(() => { pauseOtherAudio(a); setPlaying(true); }).catch(() => {});
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  // Start on the first user interaction (autoplay policy friendly)
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = 0.35;
    const start = () => {
      // Don't barge in if another player (e.g. the Audius feature) is already going.
      const otherPlaying = [...document.querySelectorAll('audio')].some((el) => el !== a && !el.paused);
      if (!otherPlaying) {
        a.play().then(() => { pauseOtherAudio(a); setPlaying(true); }).catch(() => {});
      }
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
    };
    window.addEventListener('pointerdown', start);
    window.addEventListener('keydown', start);
    return () => {
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
    };
  }, []);

  return (
    <>
      <audio ref={audioRef} src="/site-music.mp3" loop preload="auto" />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Mute music' : 'Play music'}
        title={playing ? 'Mute music' : 'Play music'}
        className="fixed bottom-3 right-3 z-40 flex h-11 w-11 items-center justify-center border-2 border-sweetardios-cyan bg-sweetardios-oxford/80 text-sweetardios-cyan backdrop-blur transition-colors hover:bg-sweetardios-cyan hover:text-sweetardios-oxford sm:bottom-5 sm:right-5"
      >
        {playing ? (
          <span className="flex items-end gap-0.5" aria-hidden>
            <span className="sw-eq h-2.5 w-1 bg-current" style={{ animationDelay: '0s' }} />
            <span className="sw-eq h-4 w-1 bg-current" style={{ animationDelay: '0.2s' }} />
            <span className="sw-eq h-3 w-1 bg-current" style={{ animationDelay: '0.4s' }} />
          </span>
        ) : (
          <span className="text-lg leading-none" aria-hidden>♪</span>
        )}
      </button>
    </>
  );
};

export default SiteMusic;
