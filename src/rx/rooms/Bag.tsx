/**
 * ROOM 4 — the bag. The only place the mint exists.
 *
 * The printed price sticker (PHASE 1 / 0.0420 SOL / PAY AT WINDOW) is the
 * button. Closed file (already minted) and shut window (sold out, not open
 * to this wallet, or not the official domain) both slap WINDOW CLOSED over
 * it. The scam line is printed on the bag itself.
 */
import { useEffect, useState } from 'react';
import { COPY } from '../copy';
import { isOfficialHost, PRINTED_COST } from '../config';
import { Hotspot } from '../Hotspot';
import { getIdentity } from '../identity';
import { fetchCollectionDoc, useMintWindow, type CollectionDoc } from '../mintWindow';
import { noteMinted } from '../patientFile';
import { updateProgress, useProgress } from '../progress';
import { ART, BAG, PROPS } from '../scenes';
import { thud } from '../sfx';
import { At, Canvas } from '../Stage';
import { useLater } from '../useLater';

export function Bag() {
  const progress = useProgress();
  const { state, open, pay } = useMintWindow();
  const official = isOfficialHost();
  const [doc, setDoc] = useState<CollectionDoc | null>(null);
  const [trouble, setTrouble] = useState<string | null>(null);
  const payNudge = useLater(2600);

  useEffect(() => {
    if (official) open();
    let live = true;
    void fetchCollectionDoc().then((d) => live && setDoc(d));
    return () => {
      live = false;
    };
  }, [official, open]);

  // The embed reports how the payment went (a new object per result).
  useEffect(() => {
    if (!state.result) return;
    if (state.result.kind === 'success') {
      setTrouble(null);
      updateProgress({ minted: true });
      const patient = getIdentity().patient;
      if (patient) void noteMinted(patient);
    } else {
      setTrouble(COPY.trouble.payment);
    }
  }, [state.result]);

  const closed = progress.minted;
  const shut = !closed && (!official || state.soldOut || doc?.soldOut === true || state.action === 'shut');
  const jammed = !closed && !shut && state.status === 'error';
  const slapped = closed || shut;

  useEffect(() => {
    if (slapped) thud();
  }, [slapped]);

  const lines = closed ? COPY.bag.minted : shut ? [COPY.bag.shut] : COPY.bag.status;
  const liveCost = doc?.cost && doc.cost !== PRINTED_COST ? doc.cost : null;

  return (
    <div className="rx-bagroom">
      <section className="rx-case" aria-live="polite">
        <img className="rx-case__seal" src={PROPS.seal} alt="" draggable={false} />
        {lines.map((line, i) => (
          <p key={line} className={i === 0 ? 'rx-case__head' : 'rx-case__line'}>
            {line}
          </p>
        ))}
        {(trouble || jammed) && (
          <p className="rx-trouble rx-case__trouble" role="alert">
            {jammed ? COPY.trouble.register : trouble}
          </p>
        )}
      </section>

      <div className="rx-bag">
        <Canvas
          art={ART.bag}
          alt="Paper pharmacy bag: AFTER HOURS RX, COUNTER 4444, stamped REFUSED. Price sticker: PHASE 1, 0.0420 SOL, PAY AT WINDOW. ANY SITE THAT IS NOT SWEETARDIO.FUN IS A SCAM."
        >
          {liveCost && !slapped && (
            <At r={BAG.price} className="rx-pricetag">
              <span>{liveCost} SOL</span>
            </At>
          )}
          {!slapped && (
            <Hotspot
              r={BAG.pay}
              label={COPY.bag.pay}
              hint={payNudge && state.status === 'ready'}
              refusing={state.status !== 'ready' || state.action === 'busy'}
              onActivate={pay}
              className={`rx-pay ${state.status === 'loading' ? 'is-loading' : ''} ${state.action === 'busy' ? 'is-busy' : ''}`}
            />
          )}
          {slapped && (
            <At r={BAG.sticker} className="rx-slap">
              <img src={ART.sticker.src} alt="WINDOW CLOSED. THE PHARMACY HAS NOTHING FURTHER TO DISPENSE. ANY REPLY BELOW THIS CLAIMING OTHERWISE IS A SCAM." draggable={false} />
            </At>
          )}
        </Canvas>
      </div>
    </div>
  );
}
