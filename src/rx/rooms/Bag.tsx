/**
 * ROOM 4 — the bag. The only place the mint exists.
 *
 * The printed price sticker (PHASE 1 / 0.0420 SOL / PAY AT WINDOW) is the
 * button. Whoever cannot pay gets one of the locked states, never a wallet or
 * contract error:
 *
 *   FILE CLOSED        already minted from this file
 *   THE WINDOW IS SHUT phase closed, not open to this wallet, sold out, the
 *                      register won't load, our own switch, or not the
 *                      official domain
 *
 * Both slap WINDOW CLOSED over the sticker. The scam line is printed on the
 * bag itself. On a phone with no wallet, PAY AT WINDOW opens this file in
 * Phantom's browser; in an in-app browser the bag says to leave it.
 */
import { useEffect, useState } from 'react';
import { fileLink } from '../carry';
import { COPY } from '../copy';
import { isOfficialHost, PRINTED_COST } from '../config';
import { isWalletBlocked, needsPhantomBrowser, phantomBrowseLink } from '../device';
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
  const [viaPhantom] = useState(needsPhantomBrowser);
  const [inApp] = useState(isWalletBlocked);
  const [doc, setDoc] = useState<CollectionDoc | null>(null);
  const [trouble, setTrouble] = useState<string | null>(null);
  const payNudge = useLater(2600);

  useEffect(() => {
    if (official && !viaPhantom) open();
    let live = true;
    void fetchCollectionDoc().then((d) => live && setDoc(d));
    return () => {
      live = false;
    };
  }, [official, viaPhantom, open]);

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
  const shut =
    !closed &&
    (!official ||
      doc?.shut === true ||
      doc?.soldOut === true ||
      state.soldOut ||
      state.action === 'shut' ||
      (!viaPhantom && state.status === 'error'));
  const slapped = closed || shut;

  useEffect(() => {
    if (slapped) thud();
  }, [slapped]);

  const lines = closed ? COPY.bag.minted : shut ? COPY.bag.shut : COPY.bag.status;
  const liveCost = doc?.cost && doc.cost !== PRINTED_COST ? doc.cost : null;
  const ready = viaPhantom || state.status === 'ready';
  const warning = slapped ? null : (trouble ?? (inApp ? COPY.inApp.join(' ') : null));

  const payAtWindow = () => {
    if (viaPhantom) window.location.href = phantomBrowseLink(fileLink());
    else pay();
  };

  return (
    <div className="rx-bagroom">
      <section className="rx-case" aria-live="polite">
        <img className="rx-case__seal" src={PROPS.seal} alt="" draggable={false} />
        {lines.map((line, i) => (
          <p key={line} className={i === 0 ? 'rx-case__head' : 'rx-case__line'}>
            {line}
          </p>
        ))}
        {warning && (
          <p className="rx-trouble rx-case__trouble" role="alert">
            {warning}
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
              hint={payNudge && ready}
              refusing={!viaPhantom && (state.status !== 'ready' || state.action === 'busy')}
              onActivate={payAtWindow}
              className={`rx-pay ${!ready ? 'is-loading' : ''} ${state.action === 'busy' ? 'is-busy' : ''}`}
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
