/**
 * ROOM 4 — the bag. The only place the mint exists.
 *
 * The printed price sticker is the purchase button. LaunchMyNFT remains
 * authoritative for price, eligibility, supply and the on-chain transaction;
 * its Solana embed sits behind the sticker so wallet connection and approval
 * happen without sending the patient to a separate page.
 */
import { useEffect, useRef, useState } from 'react';
import { COPY } from '../copy';
import { isOfficialHost, PRINTED_COST } from '../config';
import { fileLink } from '../carry';
import { isWalletBlocked, needsPhantomBrowser, phantomBrowseLink } from '../device';
import { Hotspot } from '../Hotspot';
import { fetchCollectionDoc, useMintWindow, type CollectionDoc } from '../mintWindow';
import { useIdentity } from '../identity';
import { noteMinted } from '../patientFile';
import { updateProgress, useProgress } from '../progress';
import { ART, BAG, PROPS } from '../scenes';
import { thud } from '../sfx';
import { At, Canvas } from '../Stage';
import { useLater } from '../useLater';

export function Bag({ onBack }: { onBack: () => void }) {
  const progress = useProgress();
  const identity = useIdentity();
  const { state: mint, pay } = useMintWindow();
  const official = isOfficialHost();
  const [inApp] = useState(isWalletBlocked);
  const [doc, setDoc] = useState<CollectionDoc | null>(null);
  const payNudge = useLater(2600);
  const recordedMint = useRef(0);

  useEffect(() => {
    let live = true;
    void fetchCollectionDoc().then((d) => live && setDoc(d));
    return () => {
      live = false;
    };
  }, []);

  // Close the file only after the embed reports a successful transaction.
  // Save locally immediately; the signed-in patient-file write is best-effort.
  useEffect(() => {
    const result = mint.result;
    if (!result || result.kind !== 'success' || result.seq === recordedMint.current) return;
    recordedMint.current = result.seq;
    updateProgress({ minted: true });
    if (identity.patient) void noteMinted(identity.patient);
  }, [identity.patient, mint.result]);

  const closed = progress.minted;
  const shut =
    !closed &&
    (!official ||
      doc?.shut === true ||
      doc?.soldOut === true ||
      mint.status === 'error' ||
      mint.action === 'shut');
  const slapped = closed || shut;

  useEffect(() => {
    if (slapped) thud();
  }, [slapped]);

  const lines = closed ? COPY.bag.minted : shut ? COPY.bag.shut : COPY.bag.status;
  const liveCost = doc?.cost && doc.cost !== PRINTED_COST ? doc.cost : null;
  const paymentFailed = mint.result?.kind === 'failed';
  const warning = slapped
    ? null
    : inApp
      ? COPY.inApp.join(' ')
      : paymentFailed
        ? COPY.trouble.payment
        : mint.action === 'busy'
          ? 'CHECK YOUR WALLET TO CONTINUE.'
          : null;

  const payAtWindow = () => {
    if (closed || shut || inApp || mint.action === 'busy') return;
    // A standard mobile browser cannot approve Solana transactions. Carry the
    // intake to the official site inside Phantom, where the wallet is injected.
    if (needsPhantomBrowser()) {
      window.location.assign(phantomBrowseLink(fileLink()));
      return;
    }
    pay();
  };

  const payLabel =
    mint.action === 'connect'
      ? 'CONNECT WALLET AND MINT'
      : mint.action === 'busy'
        ? 'MINT IN PROGRESS — CHECK YOUR WALLET'
        : COPY.bag.pay;

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
          <p className="rx-trouble rx-case__trouble" role="status">
            {warning}
          </p>
        )}
        <button type="button" className="rx-case__back" aria-label={COPY.bag.back} onClick={onBack}>
          <span aria-hidden>← </span>
          <span className="rx-case__back-long">{COPY.bag.back}</span>
          <span className="rx-case__back-short">{COPY.bag.backShort}</span>
        </button>
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
              label={payLabel}
              hint={Boolean(payNudge)}
              onActivate={payAtWindow}
              refusing={inApp}
              className={`rx-pay${mint.status === 'loading' ? ' is-loading' : ''}${mint.action === 'busy' ? ' is-busy' : ''}`}
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
