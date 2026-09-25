export type LossKey = 'price' | 'timing' | 'nowebsite_ok' | 'competitor' | 'noreply' | 'diy' | 'trust' | 'other'

export const LOSS: [LossKey, string][] = [
  ['price', 'Too expensive'],
  ['timing', 'Bad timing'],
  ['nowebsite_ok', "Decided they don't need a website"],
  ['competitor', 'Went with someone else'],
  ['noreply', 'Stopped replying'],
  ['diy', 'Doing it themselves'],
  ['trust', "Didn't trust the offer"],
  ['other', 'Other'],
]

export const lossLabel = (key: string): string => LOSS.find(([k]) => k === key)?.[1] ?? key

/** [what this likely means, what to try next] — shown in the funnel's "why didn't they buy" section. */
export const LOSS_ADVICE: Record<LossKey, [string, string]> = {
  price: [
    'Your price may be landing above what this segment expects.',
    'Consider a lower entry tier or a split-payment offer, and lead with the cheapest package first.',
  ],
  timing: [
    "Timing objections are often a soft no.",
    'Set a check-back date four to six weeks out and follow up once, briefly.',
  ],
  nowebsite_ok: [
    'Some businesses genuinely get enough from word of mouth and their Google listing alone.',
    'Target businesses with lower ratings or newer listings, where the gap more obviously costs them bookings.',
  ],
  competitor: [
    'You were likely being compared on price or speed.',
    'Lead with a free concept next time — a real preview beats a written pitch.',
  ],
  noreply: [
    "The message likely isn't landing, or it's easy to ignore.",
    'Shorten the first message and lead with the observation, not the offer.',
  ],
  diy: [
    'They may not be weighing the time cost of doing it themselves.',
    'Frame the pitch around time saved, not just the end result.',
  ],
  trust: [
    'Cold outreach reads as risky without proof.',
    'Attach a portfolio link or an existing client example earlier in the conversation.',
  ],
  other: [
    'No clear pattern in this reason yet.',
    'Add a short note next time you mark someone lost so this can get more specific.',
  ],
}
