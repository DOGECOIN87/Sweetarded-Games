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
 * bag itself. PAY AT WINDOW opens the LaunchMyNFT mint page directly, where
 * the wallet's own browser and adapter can handle connection and minting.
 */
import { useEffect, useState } from 'react';
import { COPY } from '../copy';
import { isOfficialHost, PRINTED_COST } from '../config';
import { isWalletBlocked } from '../device';
import { Hotspot } from '../Hotspot';
import { fetchCollectionDoc, type CollectionDoc } from '../mintWindow';
import { useProgress } from '../progress';
import { ART, BAG, PROPS } from '../scenes';
import { thud } from '../sfx';
import { At, Canvas } from '../Stage';
import { useLater } from '../useLater';

export function Bag() {
  const progress = useProgress();
  const official = isOfficialHost();
  const [inApp] = useState(isWalletBlocked);
  const [doc, setDoc] = useState<CollectionDoc | null>(null);
  const payNudge = useLater(2600);

  useEffect(() => {
    let live = true;
    void fetchCollectionDoc().then((d) => live && setDoc(d));
    return () => {
      live = false;
    };
  }, []);

  const closed = progress.minted;
  const shut =
    !closed &&
    (!official ||
      doc?.shut === true ||
      doc?.soldOut === true);
  const slapped = closed || shut;

  useEffect(() => {
    if (slapped) thud();
  }, [slapped]);

  const lines = closed ? COPY.bag.minted : shut ? COPY.bag.shut : COPY.bag.status;
  const liveCost = doc?.cost && doc.cost !== PRINTED_COST ? doc.cost : null;
  const warning = slapped ? null : (inApp ? COPY.inApp.join(' ') : null);

  const payAtWindow = () => {
    window.location.assign('https://www.launchmynft.io/mint/sweetard');
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
              hint={Boolean(payNudge)}
              onActivate={payAtWindow}
              className="rx-pay"
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
