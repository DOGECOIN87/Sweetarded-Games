/**
 * ROOM 4 — the bag. The only place the mint exists.
 *
 * Two choices sit where the paper bag used to: the Solana logo opens the
 * collection's LaunchMyNFT page (which stays authoritative for price,
 * eligibility, supply and the on-chain transaction), and the Cookie Chain
 * logo opens the Cookie Chain Edition on MomoSwap. Only the Solana choice
 * carries a printed price. When the window is shut, the Solana choice gets the
 * WINDOW CLOSED sticker; the Cookie Chain choice is a different collection and
 * stays open.
 */
import { useEffect, useState } from 'react';
import { COPY } from '../copy';
import { COOKIE_CHAIN_URL, isOfficialHost, LMNFT, PRINTED_COST } from '../config';
import { fetchCollectionDoc, type CollectionDoc } from '../mintWindow';
import { useProgress } from '../progress';
import { ART, PROPS } from '../scenes';
import { thud } from '../sfx';

export function Bag({ onBack }: { onBack: () => void }) {
  const progress = useProgress();
  const official = isOfficialHost();
  const [doc, setDoc] = useState<CollectionDoc | null>(null);

  useEffect(() => {
    let live = true;
    void fetchCollectionDoc().then((d) => live && setDoc(d));
    return () => {
      live = false;
    };
  }, []);

  const closed = progress.minted;
  const shut = !closed && (!official || doc?.shut === true || doc?.soldOut === true);
  const slapped = closed || shut;

  useEffect(() => {
    if (slapped) thud();
  }, [slapped]);

  const lines = closed ? COPY.bag.minted : shut ? COPY.bag.shut : COPY.bag.status;
  const cost = doc?.cost || PRINTED_COST;

  return (
    <div className="rx-bagroom">
      <section className="rx-case" aria-live="polite">
        <img className="rx-case__seal" src={PROPS.seal} alt="" draggable={false} />
        {lines.map((line, i) => (
          <p key={line} className={i === 0 ? 'rx-case__head' : 'rx-case__line'}>
            {line}
          </p>
        ))}
        <button type="button" className="rx-case__back" aria-label={COPY.bag.back} onClick={onBack}>
          <span aria-hidden>← </span>
          <span className="rx-case__back-long">{COPY.bag.back}</span>
          <span className="rx-case__back-short">{COPY.bag.backShort}</span>
        </button>
      </section>

      <div className="rx-pick" role="group" aria-label="Choose where to mint">
        {slapped ? (
          <div className="rx-pick__opt is-shut">
            <img className="rx-pick__logo is-solana" src="/logos/solana.svg" alt="Solana" draggable={false} />
            <span className="rx-pick__name">Sweetardio</span>
            <img
              className="rx-pick__slap"
              src={ART.sticker.src}
              alt="WINDOW CLOSED. THE PHARMACY HAS NOTHING FURTHER TO DISPENSE. ANY REPLY BELOW THIS CLAIMING OTHERWISE IS A SCAM."
              draggable={false}
            />
          </div>
        ) : (
          <a className="rx-pick__opt" href={LMNFT.page} target="_blank" rel="noopener noreferrer">
            <img className="rx-pick__logo is-solana" src="/logos/solana.svg" alt="" draggable={false} />
            <span className="rx-pick__name">Sweetardio</span>
            <span className="rx-pick__sub">Mint on Solana</span>
            <span className="rx-pick__price">{cost} SOL</span>
            <span className="rx-pick__go">Mint on LaunchMyNFT ↗</span>
          </a>
        )}
        <a className="rx-pick__opt is-cookie" href={COOKIE_CHAIN_URL} target="_blank" rel="noopener noreferrer">
          <img className="rx-pick__logo" src="/logos/cookie-chain.png" alt="" draggable={false} />
          <span className="rx-pick__name">The Cookie Chain</span>
          <span className="rx-pick__sub">Cookie Chain Edition</span>
          <span className="rx-pick__go">Mint on MomoSwap ↗</span>
        </a>
      </div>
    </div>
  );
}
