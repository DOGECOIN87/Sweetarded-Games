/* Staggered, animated patterns built only from the Sweetardios stickerz. */

// Clean die-cut stickers that read well in a floating pattern
const WALL = [
  '01_Peppermint_Butler', '02_Mr_Owl', '03_Benson', '04_Marshmallow_Man',
  '07_Rare_Candy', '08_Crying_Tomato', '09_Chibi_Monster', '10_Candy_Shop',
  '13_Box_of_Chocolates', '16_The_Bunny', '17_Hunny_Pot', '18_Pwease_Lollipop',
  '22_Sweet_Tooth', '23_Robot_Chicken_Gummy_Bear', '24_Golden_Ticket',
  '28_opengotchi', 'Sweetardio_200_27', 'Sweetardio_200_28', 'Sweetardio_200_30',
];

// Everything, for the scrolling marquee
const ALL = [
  '01_Peppermint_Butler', '02_Mr_Owl', '03_Benson', '04_Marshmallow_Man', '05_American_Pie',
  '06_Dude_Sweet', '07_Rare_Candy', '08_Crying_Tomato', '09_Chibi_Monster', '10_Candy_Shop',
  '12_Candy_Land', '13_Box_of_Chocolates', '14_Shorts_doggo', '15_Calvin_Candie', '16_The_Bunny',
  '17_Hunny_Pot', '18_Pwease_Lollipop', '19_Emyr', '20_The_meme_is_the_tech', '21_Straight_outta_Gulag',
  '22_Sweet_Tooth', '23_Robot_Chicken_Gummy_Bear', '24_Golden_Ticket', '25_Zombieland_Twinkie',
  '26_Caroline_Ellison', '28_opengotchi', 'Sweetardio_200_27', 'Sweetardio_200_28',
  'Sweetardio_200_29', 'Sweetardio_200_30',
];

/**
 * Staggered "sticker wall": a brick-offset grid of stickers, each bobbing on
 * its own delay so the whole field shimmers without moving in lockstep.
 */
export const StickerWall = ({ cols = 9, rows = 7 }: { cols?: number; rows?: number }) => {
  const cells = [];
  let k = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++, k++) {
      const sticker = WALL[k % WALL.length];
      const stagger = (r % 2) * (100 / cols / 2); // brick offset on odd rows
      cells.push({
        k,
        sticker,
        left: (c * 100) / (cols - 1 || 1),
        top: (r * 100) / (rows - 1 || 1),
        delay: ((r + c) % 6) * 0.5,
        dur: 6 + ((r * 3 + c) % 4),
        size: 5 + ((r + c) % 3) * 1.1, // rem, varied (5–7.2)
        offset: stagger,
      });
    }
  }
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {cells.map((cell) => (
        <img
          key={cell.k}
          src={`/stickers/${cell.sticker}.png`}
          alt=""
          loading="lazy"
          className="sw-float absolute object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.45)]"
          style={{
            left: `calc(${cell.left}% + ${cell.offset}%)`,
            top: `${cell.top}%`,
            width: `${cell.size}rem`,
            height: `${cell.size}rem`,
            animationDelay: `${cell.delay}s`,
            animationDuration: `${cell.dur}s`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
};

/**
 * Two rows of stickers scrolling opposite directions, each sticker also
 * bobbing on a staggered delay.
 */
export const StickerMarquee = () => {
  const rowA = ALL.slice(0, 15);
  const rowB = ALL.slice(15);
  const Row = ({ items, reverse }: { items: string[]; reverse?: boolean }) => (
    <div className="flex w-max">
      <div className={`flex ${reverse ? 'sw-marquee-rev' : 'sw-marquee-track'}`}>
        {[...items, ...items].map((s, i) => (
          <img
            key={i}
            src={`/stickers/${s}.png`}
            alt=""
            loading="lazy"
            className="sw-float mx-3 h-24 w-24 object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.45)] sm:h-28 sm:w-28"
            style={{ animationDelay: `${(i % 6) * 0.35}s` }}
          />
        ))}
      </div>
    </div>
  );
  return (
    <div aria-hidden className="space-y-4 overflow-hidden py-2">
      <Row items={rowA} />
      <Row items={rowB} reverse />
    </div>
  );
};
