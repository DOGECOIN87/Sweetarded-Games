/** Phones get the notice first. ENTER ANYWAY is printed on it — and it works, badly. */
import { COPY } from '../copy';
import { Hotspot } from '../Hotspot';
import { Rain } from '../Rain';
import { ART, MOBILE } from '../scenes';
import { Canvas } from '../Stage';

export const isPhoneish = () =>
  window.matchMedia('(max-width: 900px), (hover: none) and (pointer: coarse)').matches;

export function PhoneGate({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="rx-gate">
      <Rain />
      <Canvas art={ART.mobile} alt={COPY.mobile.alt} className="rx-gate__notice">
        <Hotspot r={MOBILE.enter} label={COPY.mobile.enter} onActivate={onEnter} className="rx-hotspot--paper rx-hotspot--silent" />
      </Canvas>
    </div>
  );
}
