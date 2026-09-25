import type { Prospect } from './types'
import { FUNNEL_STAGES, reachedStage } from './stage'

export interface FunnelRow {
  key: string
  label: string
  n: number
  /** Conversion rate from the previous row, null for the first row. */
  rate: number | null
}

export interface FunnelStats {
  total: number
  rows: FunnelRow[]
  lost: number
  won: number
  revenue: number
  avgClose: number | null
  objections: Record<string, number>
  loss: Record<string, number>
}

export function funnelStats(prospects: Prospect[]): FunnelStats {
  const counts = FUNNEL_STAGES.map((s) => prospects.filter((p) => reachedStage(p, s.key)).length)
  const rows: FunnelRow[] = FUNNEL_STAGES.map((s, i) => ({
    key: s.key,
    label: s.label,
    n: counts[i],
    rate: i === 0 ? null : counts[i - 1] ? counts[i] / counts[i - 1] : 0,
  }))

  const lostList = prospects.filter((p) => p.status === 'lost')
  const wonList = prospects.filter((p) => p.status === 'won')
  const revenue = wonList.reduce((sum, p) => sum + (Number(p.won_value) || 0), 0)

  const closeDays = wonList
    .map((p) => {
      const start = p.events?.sent
      const end = p.events?.won
      if (!start || !end) return null
      return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 864e5)
    })
    .filter((x): x is number => x !== null && x >= 0)
  const avgClose = closeDays.length ? Math.round(closeDays.reduce((a, b) => a + b, 0) / closeDays.length) : null

  const objections: Record<string, number> = {}
  for (const p of prospects) if (p.objection) objections[p.objection] = (objections[p.objection] || 0) + 1

  const loss: Record<string, number> = {}
  for (const p of lostList) if (p.lost_reason) loss[p.lost_reason] = (loss[p.lost_reason] || 0) + 1

  return { total: prospects.length, rows, lost: lostList.length, won: wonList.length, revenue, avgClose, objections, loss }
}

export interface Leak {
  fromKey: string
  fromLabel: string
  fromN: number
  toKey: string
  toLabel: string
  toN: number
  drop: number
}

/** The stage-to-stage transition with the single biggest raw drop-off. */
export function biggestLeak(stats: FunnelStats): Leak | null {
  let leak: Leak | null = null
  for (let i = 1; i < stats.rows.length; i++) {
    const from = stats.rows[i - 1]
    const to = stats.rows[i]
    const drop = from.n - to.n
    if (drop > 0 && (!leak || drop > leak.drop)) {
      leak = { fromKey: from.key, fromLabel: from.label, fromN: from.n, toKey: to.key, toLabel: to.label, toN: to.n, drop }
    }
  }
  return leak
}

/** [what the leak likely means, what to try] per stage the drop lands on. */
export const LEAK_ADVICE: Record<string, [string, string]> = {
  sent: [
    "Most of your prospects haven't been contacted yet.",
    'Block time for outreach — the Queue tab on Outreach walks through one prospect at a time.',
  ],
  replied: [
    "Your first message may not be landing.",
    'Keep it short, lead with the observation about their reviews, and make the ask a single yes/no question.',
  ],
  interested: [
    "Replies aren't turning into real interest.",
    'Ask one clarifying question instead of pitching further — find out what they actually want first.',
  ],
  qualified: [
    'Interested prospects are stalling before you can qualify them.',
    'Ask directly about budget, timing and who decides. It feels forward but saves weeks.',
  ],
  mockup: [
    "Qualified prospects aren't getting a concept.",
    'A free concept converts far better than more back-and-forth — send one before the conversation goes cold.',
  ],
  proposal: [
    "Concepts aren't leading to a proposal.",
    'Follow up on the concept directly: "What would you change first?" reopens the conversation.',
  ],
  won: [
    'Proposals are stalling before close.',
    'Ask for the decision directly, and offer split payment if you have not already.',
  ],
}
