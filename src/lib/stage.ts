import type { Prospect, Status } from './types'

/**
 * Every status past "new" gets stamped into `events` the first time a
 * prospect reaches it (keyed independently of current status), so the
 * Funnel page can still count "reached qualified" even after a prospect
 * is later marked lost or moves further along. Never overwritten once set.
 */
export const STATUS_EVENT_KEY: Partial<Record<Status, string>> = {
  contacted: 'sent',
  replied: 'replied',
  interested: 'interested',
  qualified: 'qualified',
  mockup: 'mockup',
  proposal: 'proposal',
  won: 'won',
}

/** The funnel's stage ladder, in order, each tied to its event key. "lost" is tracked separately. */
export const FUNNEL_STAGES: { key: string; label: string }[] = [
  { key: 'total', label: 'Prospects' },
  { key: 'sent', label: 'Contacted' },
  { key: 'replied', label: 'Replied' },
  { key: 'interested', label: 'Interested' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'mockup', label: 'Concept sent' },
  { key: 'proposal', label: 'Proposal sent' },
  { key: 'won', label: 'Won' },
]

export function reachedStage(p: Pick<Prospect, 'events'>, key: string): boolean {
  if (key === 'total') return true
  return !!p.events?.[key]
}

/** Returns the events patch to send with a status update — adds today's timestamp
 * under the matching key the first time (and only the first time) it's reached. */
export function stampEvent(current: Record<string, string> | null | undefined, status: Status, when = new Date().toISOString()): Record<string, string> {
  const key = STATUS_EVENT_KEY[status]
  const base = current || {}
  if (!key || base[key]) return base
  return { ...base, [key]: when }
}
