import type { OrgSettings, PackageDef, Prospect } from './types'
import { score } from './scoring'

/** Maps a raw category string to the plain-language kind used in copy and in kinds.ts. */
export function kindOf(p: Pick<Prospect, 'category'>): string {
  const c = (p.category || '').toLowerCase()
  if (c.includes('barber')) return 'barbershop'
  if (c.includes('nail')) return 'nail bar'
  if (c.includes('spa')) return 'spa'
  if (c.includes('hair') || c.includes('salon') || c.includes('beauty')) return 'salon'
  if (c.includes('tour')) return 'tour operator'
  return 'business'
}

/** Picks a package key from the prospect's strength, same tiers used across Settings. */
export function recommendPackageKey(p: Prospect): 'starter' | 'business' | 'premium' {
  const s = score(p)
  if (s >= 80) return 'premium'
  if (s >= 55) return 'business'
  return 'starter'
}

export function packageFor(p: Prospect, settings: OrgSettings): PackageDef {
  const key = recommendPackageKey(p)
  return settings.packages[key] ?? Object.values(settings.packages)[0]
}

/** First name / short form used to open a message ("Hi Marcus,"). */
export const firstName = (p: Pick<Prospect, 'name'>): string => p.name.split(/[\s,]/)[0] || p.name

/** Replaces {ME} / {PKG} / {PRICE} tokens — keep these tokens in any pitch text you hand-edit. */
export function fill(template: string, p: Prospect, settings: OrgSettings): string {
  const pkg = packageFor(p, settings)
  return template
    .replaceAll('{ME}', settings.owner_name)
    .replaceAll('{PKG}', pkg.name)
    .replaceAll('{PRICE}', p.quote || pkg.price)
}

/** The one honest sentence describing the opportunity — never invents anything not in the record. */
export function gapSentence(p: Prospect): string {
  switch (p.website_type) {
    case 'none':
      return p.instagram || p.facebook
        ? `the only link on your Google profile is your ${p.instagram ? 'Instagram' : 'Facebook'} page`
        : "your Google profile doesn't link to a website"
    case 'weak':
      return p.website_note || 'your website is on a free site-builder or booking-platform address rather than your own domain'
    case 'listing':
      return p.website_note || "the website button on your Google profile leads to a page that isn't really yours (dead link, directory listing, or third-party booking page)"
    default:
      return 'your site could use a refresh'
  }
}

export function genPitch(p: Prospect, settings: OrgSettings): string {
  const kind = kindOf(p)
  const ratingBit = p.reviews > 0 ? `${p.rating.toFixed(1)} stars from ${p.reviews} Google reviews is a strong reputation` : 'your reputation locally is strong'
  const first = firstName(p).replace(/^the$/i, p.name)
  return fill(
    `Hi ${first}, I'm {ME}, a Jamaican brand and web designer. ${ratingBit}, and I noticed ${gapSentence(p)}. I build a {PKG} for Jamaican ${kind}s: a mobile-first, WhatsApp-ready landing page with a clean brand, for {PRICE}. Want me to send a free homepage concept for ${p.name}?`,
    p,
    settings
  )
}

/** Four escalating follow-up messages, keyed by which attempt this is (0-indexed). */
const FOLLOWUP_TEMPLATES: ((p: Prospect) => string)[] = [
  (p) => `Hi ${firstName(p)}, just floating this back up in case it got buried — want me to put together that free homepage concept for ${p.name}? No obligation either way.`,
  (p) => `Hi ${firstName(p)}, checking in again — happy to send a free concept whenever's useful for you. Just say the word.`,
  (p) => `Hi ${firstName(p)}, one more check-in from me — if now isn't the right time, no worries at all, just let me know and I'll leave it there.`,
  (p) => `Hi ${firstName(p)}, last note from me on this one — the offer's still open whenever ${p.name} is ready.`,
]

export function genFollowUp(p: Prospect, step: number, settings: OrgSettings): string {
  const tmpl = FOLLOWUP_TEMPLATES[Math.min(Math.max(step, 0), FOLLOWUP_TEMPLATES.length - 1)]
  return fill(tmpl(p), p, settings)
}
