import { RARITY_CATEGORIES, SUPPLY } from './rarity';

/**
 * The animated weather tier — 444 tokens carry a seamless video loop.
 * File slugs match public/rarity/weather/{slug}.webm (+ -poster.webp).
 * Ordered rarest first so the landing wall and the rarity vault stay aligned.
 */
export const WEATHER_STATES = [
  'Tornado',
  'Flooded',
  'Blizzard',
  'Storm',
  'Fog',
  'Snow',
  'Rain',
] as const;

export type WeatherName = (typeof WEATHER_STATES)[number];

export const weatherSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

export const weatherSrc = (name: string) => `/rarity/weather/${weatherSlug(name)}.webm`;

export const weatherPoster = (name: string) => `/rarity/weather/${weatherSlug(name)}-poster.webp`;

const weatherCategory = RARITY_CATEGORIES.find((c) => c.id === 'weather');

export const weatherRow = (name: string) => weatherCategory?.rows.find((r) => r.name === name);

export const weatherOneIn = (count: number) => Math.round(SUPPLY / count);

export const WEATHER_CARRIED = weatherCategory?.carried ?? { count: 444, share: 10 };
