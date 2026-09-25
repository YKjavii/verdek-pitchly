import type { Prospect } from './types'
import { addDays, today } from './utils'

/** Days after contact each follow-up is due. */
export const FU_DAYS = [2, 4, 7, 10]
export const FU_LABEL = ['First nudge', 'Second check-in', 'Third check-in', 'Final follow-up']

export interface FollowupState {
  step: number
  due: string
  overdue: boolean
  /** True once every scheduled follow-up has been sent. */
  done: boolean
}

/**
 * The follow-up sequence only runs while a prospect is sitting in "contacted"
 * with no reply yet — any reply (or a later stage) stops it, same as the
 * original artifact.
 */
export function fuState(p: Prospect): FollowupState | null {
  if (p.status !== 'contacted' || !p.contacted_at) return null
  const done = p.fu_done || 0
  if (done >= FU_DAYS.length) return { step: FU_DAYS.length - 1, due: '', overdue: false, done: true }
  const due = addDays(FU_DAYS[done], p.contacted_at.slice(0, 10))
  return { step: done, due, overdue: due <= today(), done: false }
}

export interface DueFollowup {
  p: Prospect
  f: FollowupState
}

export function dueFollowups(prospects: Prospect[]): DueFollowup[] {
  return prospects
    .map((p) => ({ p, f: fuState(p) }))
    .filter((x): x is DueFollowup => !!x.f && !x.f.done)
    .sort((a, b) => a.f.due.localeCompare(b.f.due))
}

/** Patch to apply after sending a follow-up message. */
export function markFuSentPatch(p: Prospect): Partial<Prospect> {
  return { fu_done: (p.fu_done || 0) + 1 }
}
