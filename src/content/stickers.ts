/**
 * The Stickers — every sticker character in the Sweetardio collection.
 * Files live in public/stickers/; names are the display labels used by the
 * landing-page sticker stream and the /stickers page. Add new cast members here.
 */
export interface Sticker {
  file: string;
  name: string;
}

export const STICKERS: Sticker[] = [
  { file: '01_Peppermint_Butler.png', name: 'Peppermint Butler' },
  { file: '02_Mr_Owl.png', name: 'Mr Owl' },
  { file: '03_Benson.png', name: 'Benson' },
  { file: '04_Marshmallow_Man.png', name: 'Marshmallow Man' },
  { file: '05_American_Pie.png', name: 'American Pie' },
  { file: '06_Dude_Sweet.png', name: 'Dude Sweet' },
  { file: '07_Rare_Candy.png', name: 'Rare Candy' },
  { file: '10_Candy_Shop.png', name: 'Candy Shop' },
  { file: '12_Candy_Land.png', name: 'Candy Land' },
  { file: '13_Box_of_Chocolates.png', name: 'Box of Chocolates' },
  { file: '15_Calvin_Candie.png', name: 'Calvin Candie' },
  { file: '16_The_Bunny.png', name: 'The Bunny' },
  { file: '17_Hunny_Pot.png', name: 'Hunny Pot' },
  { file: '18_Pwease_Lollipop.png', name: 'Pwease Lollipop' },
  { file: '20_The_meme_is_the_tech.png', name: 'The Meme Is the Tech' },
  { file: '21_Straight_outta_Gulag.png', name: 'Straight Outta Gulag' },
  { file: '22_Sweet_Tooth.png', name: 'Sweet Tooth' },
  { file: '23_Robot_Chicken_Gummy_Bear.png', name: 'Robot Chicken Gummy Bear' },
  { file: '24_Golden_Ticket.png', name: 'Golden Ticket' },
  { file: '25_Zombieland_Twinkie.png', name: 'Zombieland Twinkie' },
  { file: '26_Caroline_Ellison.png', name: 'Caroline Ellison' },
  { file: '28_opengotchi.png', name: 'Opengotchi' },
  { file: 'Cookboy.png', name: 'Cookboy' },
];

/** The originals in public/stickers/ are huge sticker-sheet canvases with the
 *  art tucked in one corner — the site renders the trimmed cuts instead. */
export const stickerSrc = (member: Sticker) => `/stickers/trimmed/${member.file}`;
