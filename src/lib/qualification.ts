import type { OrgSettings, Prospect } from './types'
import { fill, firstName } from './pitch'

export type QualKey = 'hot' | 'warm' | 'price' | 'later' | 'low'

export interface QualDef {
  key: QualKey
  label: string
  /** Tailwind text-color classes for badges/chips. */
  tone: string
  advice: string
}

export const QUAL: Record<QualKey, QualDef> = {
  hot: {
    key: 'hot',
    label: 'Ready to buy',
    tone: 'text-emerald-600 dark:text-emerald-400',
    advice: 'Move fast — send the concept and a clear price today. Interest like this fades within days.',
  },
  warm: {
    key: 'warm',
    label: 'Interested, deciding',
    tone: 'text-brand-600 dark:text-brand-400',
    advice: 'Keep it easy: one message, one clear next step. Offer to send a free concept so there is something concrete to react to.',
  },
  price: {
    key: 'price',
    label: 'Price sensitive',
    tone: 'text-amber-600 dark:text-amber-400',
    advice: 'Lead with the Starter package and exactly what it includes before defending the price. Consider a split-payment offer if you make one.',
  },
  later: {
    key: 'later',
    label: 'Not now',
    tone: 'text-neutral-500 dark:text-neutral-400',
    advice: 'Set a check-back date about two weeks out and leave it there — following up sooner tends to read as pushy.',
  },
  low: {
    key: 'low',
    label: 'Unlikely',
    tone: 'text-neutral-400 dark:text-neutral-500',
    advice: 'Low priority. Worth one more honest attempt, then focus your time on fresher prospects.',
  },
}

export const QUAL_LIST: QualDef[] = Object.values(QUAL)

/** Qualifications that count as strong enough to auto-advance the pipeline stage to "qualified". */
export const QUALIFIES_AS_QUALIFIED: QualKey[] = ['hot', 'warm', 'price']

export function qualAdvice(key: string): string {
  return QUAL[key as QualKey]?.advice ?? ''
}

/** A closing message for when a qualified/proposal-stage prospect needs a nudge to decide. */
export function closeMsg(p: Prospect, settings: OrgSettings): string {
  return fill(
    `Hi ${firstName(p)}, following up to see if you'd like to go ahead with the {PKG} at {PRICE}. Happy to answer any last questions — otherwise I can get started as soon as you give the word.`,
    p,
    settings
  )
}
