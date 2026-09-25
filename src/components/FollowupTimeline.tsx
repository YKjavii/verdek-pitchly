import { FU_DAYS, FU_LABEL, fuState } from '../lib/followups'
import { fmtShortDate } from '../lib/utils'
import type { Prospect } from '../lib/types'

export default function FollowupTimeline({ prospect }: { prospect: Prospect }) {
  const f = fuState(prospect)
  if (!f) return <p className="text-sm text-neutral-500">Follow-ups only run while a prospect is contacted with no reply yet.</p>

  return (
    <ol className="space-y-2">
      {FU_DAYS.map((_, i) => {
        const state = i < f.step || f.done ? 'sent' : i === f.step ? (f.overdue ? 'due' : 'upcoming') : 'pending'
        return (
          <li key={i} className="flex items-center gap-3 text-sm">
            <span
              className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                state === 'sent'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : state === 'due'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                    : state === 'upcoming'
                      ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                      : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800'
              }`}
            >
              {state === 'sent' ? '✓' : i + 1}
            </span>
            <span className="flex-1">{FU_LABEL[i]}</span>
            <span className="text-xs text-neutral-500">
              {state === 'sent' ? 'Sent' : i === f.step ? (f.overdue ? 'Due now' : `Due ${fmtShortDate(f.due)}`) : 'Not yet due'}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
