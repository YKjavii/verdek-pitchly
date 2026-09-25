import type { Prospect, WebsiteType } from './types'

export type Tier = 'hot' | 'warm' | 'cool'

export const TIER_LABEL: Record<Tier, string> = { hot: 'Hot', warm: 'Warm', cool: 'Cool' }

/**
 * Ported from the original Pitchly artifact's score() function.
 * Blends review strength (rating + volume) with how big the online
 * presence gap is. Calibrated around the 0-300 review range typical
 * of Jamaican salons/barbershops/spas (the niche this build focuses
 * on) — retune the log base below if you branch into a vertical with
 * much higher typical review counts.
 */
export function score(p: Pick<Prospect, 'reviews' | 'rating' | 'website_type'>): number {
  const rs = Math.min(1, Math.log(1 + p.reviews) / Math.log(251))
  const rt = Math.max(0, Math.min(1, (p.rating - 3.5) / 1.5))
  const gap = gapWeight(p.website_type)
  let s = (rs * 0.5 + rt * 0.5) * 50 + gap
  if (p.reviews < 15) s *= 0.6
  else if (p.reviews < 40) s *= 0.8
  else if (p.reviews < 75) s *= 0.92
  return Math.round(s)
}

function gapWeight(type: WebsiteType): number {
  switch (type) {
    case 'none':
      return 50
    case 'weak':
      return 40
    case 'listing':
      return 25
    default:
      return 5
  }
}

export function tierOf(s: number): Tier {
  if (s >= 72) return 'hot'
  if (s >= 55) return 'warm'
  return 'cool'
}

export const webLabel = (p: Pick<Prospect, 'website_type'>): string =>
  ({
    none: 'No website',
    weak: 'Weak site',
    listing: 'Listing issue',
    has_site: 'Has a site',
  })[p.website_type]
