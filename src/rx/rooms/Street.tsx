/** ROOM 1 — the street, in the rain. One way in; everything else just answers back. */
import { useState } from 'react';
import { COPY } from '../copy';
import { Hotspot } from '../Hotspot';
import { Rain } from '../Rain';
import { ART, FOCUS, STREET } from '../scenes';
import { Stage } from '../Stage';
import { useLater } from '../useLater';

export function Street({ onEnter }: { onEnter: () => void }) {
  const [entering, setEntering] = useState(false);
  const nudge = useLater(3800);

  const enter = () => {
    if (entering) return;
    setEntering(true);
    onEnter();
  };

  return (
    <>
      <Stage
        art={ART.street}
        alt="A night pharmacy on a wet street. Neon: AFTER HOURS RX, COUNTER 4444. The door reads AFTER HOURS WINDOW OPEN."
        focus={FOCUS.street}
        className={`rx-street ${entering ? 'is-entering' : ''}`}
      >
        <Hotspot r={STREET.door} label={COPY.street.door} hint={nudge && !entering} onActivate={enter} />
        <Hotspot r={STREET.leftWindow} label={COPY.street.driveThru} dead />
        <Hotspot r={STREET.rightWindow} label={COPY.street.insurance} dead />
        <Hotspot r={STREET.sugar} label={COPY.street.sugar} dead className="rx-hotspot--tiny" />
      </Stage>
      <Rain />
    </>
  );
}
