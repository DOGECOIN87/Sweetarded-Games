/** ROOM 1 — the street. One way in; everything else just answers back. */
import { useState } from 'react';
import { COPY } from '../copy';
import { Hotspot } from '../Hotspot';
import { ART, STREET } from '../scenes';
import { Stage } from '../Stage';
import { useLater } from '../useLater';

export function Street({ pan, onEnter }: { pan: boolean; onEnter: () => void }) {
  const [entering, setEntering] = useState(false);
  const nudge = useLater(3800);

  const enter = () => {
    if (entering) return;
    setEntering(true);
    onEnter();
  };

  return (
    <Stage
      art={ART.street}
      alt="A night pharmacy on a wet street. Neon: AFTER HOURS RX, COUNTER 4444. The door reads AFTER HOURS WINDOW OPEN."
      pan={pan}
      focusX={STREET.door.x + STREET.door.w / 2}
      className={`rx-street ${entering ? 'is-entering' : ''}`}
    >
      <Hotspot r={STREET.door} label={COPY.street.door} hint={nudge && !entering} onActivate={enter} />
      <Hotspot r={STREET.leftWindow} label={COPY.street.driveThru} dead />
      <Hotspot r={STREET.rightWindow} label={COPY.street.insurance} dead />
      <Hotspot r={STREET.sugar} label={COPY.street.sugar} dead className="rx-hotspot--tiny" />
    </Stage>
  );
}
