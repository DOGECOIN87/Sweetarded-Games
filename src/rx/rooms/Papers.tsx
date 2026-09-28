/** The papers that aren't the pad: PATH A's receipt and PATH B's stamp. */
import { ART, PROPS } from '../scenes';
import { Canvas } from '../Stage';

/** PATH A — took the meds. The receipt's own words say the rest. */
export function Receipt({ shown }: { shown: boolean }) {
  return (
    <div className={`rx-receipt ${shown ? 'is-shown' : ''}`} aria-hidden={!shown || undefined}>
      <Canvas
        art={ART.receipt}
        alt="Receipt, COUNTER 4444, RX-4444: PRESCRIPTION FILLED. YOU ARE NOT A SWEETARDIO. Stamped FILLED. NO REFILL. WINDOW CLOSED."
      />
    </div>
  );
}

/** PATH B — spat them into the trash. REFUSED comes down on the whole window. */
export function RefusedStamp() {
  return (
    <div className="rx-stamp" role="img" aria-label="AFTER HOURS RX — REFUSED">
      <img src={PROPS.seal} alt="" draggable={false} />
    </div>
  );
}
