/**
 * The Cast — every sticker character in the Sweetardio collection.
 * Files live in public/stickers/; names are the display labels used by the
 * landing-page cast stream and the /cast page. Add new cast members here.
 */
export interface CastMember {
  file: string;
  name: string;
}

export const CAST: CastMember[] = [
  { file: '01_Peppermint_Butler.png', name: 'Peppermint Butler' },
  { file: '02_Mr_Owl.png', name: 'Mr Owl' },
  { file: '03_Benson.png', name: 'Benson' },
  { file: '04_Marshmallow_Man.png', name: 'Marshmallow Man' },
  { file: '05_American_Pie.png', name: 'American Pie' },
  { file: '06_Dude_Sweet.png', name: 'Dude Sweet' },
  { file: '07_Rare_Candy.png', name: 'Rare Candy' },
  { file: '08_Crying_Tomato.png', name: 'Crying Tomato' },
  { file: '09_Chibi_Monster.png', name: 'Chibi Monster' },
  { file: '10_Candy_Shop.png', name: 'Candy Shop' },
  { file: '12_Candy_Land.png', name: 'Candy Land' },
  { file: '13_Box_of_Chocolates.png', name: 'Box of Chocolates' },
  { file: '14_Shorts_doggo.png', name: 'Shorts Doggo' },
  { file: '15_Calvin_Candie.png', name: 'Calvin Candie' },
  { file: '16_The_Bunny.png', name: 'The Bunny' },
  { file: '17_Hunny_Pot.png', name: 'Hunny Pot' },
  { file: '18_Pwease_Lollipop.png', name: 'Pwease Lollipop' },
  { file: '19_Emyr.png', name: 'Emyr' },
  { file: '20_The_meme_is_the_tech.png', name: 'The Meme Is the Tech' },
  { file: '21_Straight_outta_Gulag.png', name: 'Straight Outta Gulag' },
  { file: '22_Sweet_Tooth.png', name: 'Sweet Tooth' },
  { file: '23_Robot_Chicken_Gummy_Bear.png', name: 'Robot Chicken Gummy Bear' },
  { file: '24_Golden_Ticket.png', name: 'Golden Ticket' },
  { file: '25_Zombieland_Twinkie.png', name: 'Zombieland Twinkie' },
  { file: '26_Caroline_Ellison.png', name: 'Caroline Ellison' },
  { file: '28_opengotchi.png', name: 'Opengotchi' },
  { file: 'Sweetardio_200_27.png', name: 'Sweetardio #27' },
  { file: 'Sweetardio_200_28.png', name: 'Sweetardio #28' },
  { file: 'Sweetardio_200_29.png', name: 'Sweetardio #29' },
  { file: 'Sweetardio_200_30.png', name: 'Sweetardio #30' },
];

/** The originals in public/stickers/ are huge sticker-sheet canvases with the
 *  art tucked in one corner — the site renders the trimmed cuts instead. */
export const stickerSrc = (member: CastMember) => `/stickers/trimmed/${member.file}`;
