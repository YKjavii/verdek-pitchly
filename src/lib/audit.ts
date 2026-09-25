import type { Prospect } from './types'
import { webLabel } from './scoring'
import { gapSentence, kindOf } from './pitch'
import { kindMeta } from './kinds'

export interface Audit {
  kind: string
  kindLabel: string
  google: string
  website: string
  websiteDetail: string
  opportunity: string
  service: string
  social: string
  checklist: string[]
}

// Memoized per prospect object so repeated reads within a render (drawer +
// list row + funnel) don't recompute the same strings.
const auditCache = new WeakMap<Prospect, Audit>()

export function audit(p: Prospect): Audit {
  const cached = auditCache.get(p)
  if (cached) return cached

  const kind = kindOf(p)
  const meta = kindMeta(kind)
  const google = `${p.rating.toFixed(1)}★ · ${p.reviews} ${p.reviews === 1 ? 'review' : 'reviews'}`
  const website = webLabel(p)
  const gap = gapSentence(p)

  const websiteDetail =
    p.website_type === 'none'
      ? "There's no website link on their Google profile at all."
      : p.website_type === 'weak'
        ? `Their site sits on a free builder or third-party address${p.website_url ? ` (${p.website_url})` : ''} rather than a real domain.`
        : p.website_type === 'listing'
          ? `The website link on their Google profile ${p.website_note || "doesn't lead anywhere useful"}.`
          : p.website_note || 'They already have a working site — worth a second look before pitching.'

  const social =
    [p.instagram && `Instagram (@${p.instagram})`, p.facebook && 'a Facebook page'].filter(Boolean).join(' and ') ||
    'no social links on file'

  const solution = meta.solution
  const opportunity = `${p.name} has a strong reputation (${google}), but ${gap}. Building ${solution} would turn that reputation into bookings.`
  const service = `Recommended: ${solution}.`

  const checklist = [
    'Confirm the Google listing is really theirs (name, area and phone match).',
    p.website_type !== 'none'
      ? "Open the website link yourself and confirm it's actually broken, weak, or not really theirs."
      : 'Double-check there truly is no website before pitching that as the gap.',
    p.phone
      ? `Confirm ${p.phone} is a working number before messaging.`
      : 'No phone on file — find one, or plan to reach out via Instagram/Facebook instead.',
    'Skim a few recent reviews for details (prices mentioned, specialties, complaints) you can reference honestly.',
  ]

  const result: Audit = { kind, kindLabel: meta.label, google, website, websiteDetail, opportunity, service, social, checklist }
  auditCache.set(p, result)
  return result
}

/** Short version of the opportunity sentence, used in list/row tooltips. */
export const whyText = (p: Prospect): string => audit(p).opportunity
