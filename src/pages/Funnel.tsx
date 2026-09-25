import { Link } from 'react-router-dom'
import { useProspects } from '../hooks/useProspects'
import { biggestLeak, funnelStats, LEAK_ADVICE } from '../lib/funnel'
import { lossLabel, LOSS_ADVICE, type LossKey } from '../lib/loss'
import { objectionOf } from '../lib/objections'
import { plural } from '../lib/utils'

export default function Funnel() {
  const { prospects, loading } = useProspects()

  if (loading) return <p className="text-sm text-neutral-500">Loading…</p>

  const stats = funnelStats(prospects)
  const leak = biggestLeak(stats)
  const max = Math.max(1, stats.rows[0]?.n ?? 1)
  const sent = stats.rows[1]?.n ?? 0
  const replied = stats.rows[2]?.n ?? 0
  const empty = sent === 0

  const objEntries = Object.entries(stats.objections).sort((a, b) => b[1] - a[1])
  const lossEntries = Object.entries(stats.loss).sort((a, b) => b[1] - a[1])
  const lossTotal = stats.lost

  const pct = (x: number | null) => (x == null ? '—' : `${Math.round(x * 100)}%`)

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wide text-neutral-500">Funnel</div>
        <h1 className="text-2xl font-semibold mt-1">Where prospects drop out</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Every stage from prospect to paying client, so you can tell whether the problem is targeting, messaging, the offer, pricing or closing.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Kpi big={stats.total} label="Prospects" />
          <Kpi big={sent} label="Contacted" />
          <Kpi big={pct(sent ? replied / sent : null)} label="Reply rate" />
          <Kpi big={stats.won} label="Clients won" />
        </div>
        {stats.revenue > 0 && (
          <p className="text-sm text-neutral-500 mt-3">
            Recorded deal value: <b className="font-mono">JMD {Math.round(stats.revenue).toLocaleString()}</b>
            {stats.avgClose != null && ` · Average ${stats.avgClose} ${plural(stats.avgClose, 'day')} from first message to close`}
          </p>
        )}
      </div>

      {empty && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 text-center">
          <h3 className="font-semibold">Your funnel starts with the first message</h3>
          <p className="text-sm text-neutral-500 mt-1">Mark a prospect as contacted and the funnel fills in as you log replies, concepts, proposals and wins. Nothing here is sample data.</p>
          <Link to="/outreach" className="inline-block mt-3 btn-primary">
            Start pitching
          </Link>
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
        <h3 className="font-semibold mb-1">Funnel</h3>
        <p className="text-sm text-neutral-500 mb-3">Each bar shows how many prospects reached that stage. Percentages compare with the stage before it.</p>
        <ol className="space-y-3">
          {stats.rows.map((row) => {
            const isLeak = leak && leak.toKey === row.key
            const width = Math.max(row.n ? 2 : 0, (row.n / max) * 100)
            return (
              <li key={row.key} className={isLeak ? 'rounded-lg ring-1 ring-red-300 dark:ring-red-800 p-2 -m-2' : ''}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{row.label}</span>
                  <span className="font-mono">
                    {row.n}
                    {row.rate != null && <i className="text-neutral-400 ml-1 not-italic">{pct(row.rate)}</i>}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <div className={`h-full rounded-full ${isLeak ? 'bg-red-500' : 'bg-brand-600'}`} style={{ width: `${width}%` }} />
                </div>
                {isLeak && leak && <p className="text-xs text-red-600 dark:text-red-400 mt-1">Biggest drop: {leak.drop} {plural(leak.drop, 'prospect')} lost here.</p>}
              </li>
            )
          })}
        </ol>
        <p className="text-xs text-neutral-500 mt-3">
          {stats.lost} {plural(stats.lost, 'prospect')} marked lost.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <h3 className="font-semibold mb-2">What this suggests</h3>
          {leak ? (
            <>
              <p className="text-sm">
                <b>{LEAK_ADVICE[leak.toKey]?.[0]}</b>{' '}
                {leak.fromKey === 'total'
                  ? `${pct(1 - leak.toN / leak.fromN)} of your prospects haven't been contacted yet.`
                  : `${pct(1 - leak.toN / leak.fromN)} of prospects at "${leak.fromLabel}" didn't reach "${leak.toLabel}".`}
              </p>
              <p className="text-sm text-neutral-500 mt-2">{LEAK_ADVICE[leak.toKey]?.[1]}</p>
            </>
          ) : (
            <p className="text-sm text-neutral-500">
              {sent < 5
                ? 'Contact at least 5 prospects and Pitchly will point to the biggest drop-off. Small samples mislead, so treat early numbers gently.'
                : 'No stage stands out yet. Keep logging replies and outcomes.'}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <h3 className="font-semibold mb-2">Objections heard</h3>
          {objEntries.length ? (
            <ul className="space-y-2">
              {objEntries.map(([key, n]) => (
                <li key={key} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 truncate">{objectionOf(key)?.label ?? key}</span>
                  <div className="w-24 h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div className="h-full bg-brand-600 rounded-full" style={{ width: `${(n / objEntries[0][1]) * 100}%` }} />
                  </div>
                  <b className="font-mono w-5 text-right">{n}</b>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500">When a prospect says they're interested but stalls, log the blocker on their profile and it appears here.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
        <h3 className="font-semibold mb-2">Why didn't they buy?</h3>
        {lossTotal ? (
          <>
            <ul className="space-y-2">
              {lossEntries.map(([key, n]) => (
                <li key={key} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 truncate">{lossLabel(key)}</span>
                  <div className="w-24 h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${(n / lossEntries[0][1]) * 100}%` }} />
                  </div>
                  <b className="font-mono w-10 text-right">{Math.round((n / lossTotal) * 100)}%</b>
                </li>
              ))}
            </ul>
            {lossEntries[0] && (
              <div className="mt-3 rounded-lg bg-neutral-100 dark:bg-neutral-800/60 p-3 text-sm">
                <p>
                  <b>{LOSS_ADVICE[lossEntries[0][0] as LossKey]?.[0]}</b> {LOSS_ADVICE[lossEntries[0][0] as LossKey]?.[1]}
                </p>
                {lossTotal < 5 && <p className="text-xs text-neutral-500 mt-1">Based on {lossTotal} lost {plural(lossTotal, 'deal')}. Patterns get reliable after about 10.</p>}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-neutral-500">When you mark a prospect lost, you'll pick a reason. Pitchly totals them here and recommends what to change in your pitch, targeting, offer or pricing.</p>
        )}
      </div>
    </div>
  )
}

function Kpi({ big, label }: { big: number | string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold font-mono">{big}</div>
      <div className="text-xs text-neutral-500 mt-0.5">{label}</div>
    </div>
  )
}
