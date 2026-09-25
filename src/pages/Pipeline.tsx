import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useProspects } from '../hooks/useProspects'
import { score, tierOf } from '../lib/scoring'
import { STATUSES } from '../lib/types'

/** The kanban board — used as a tab inside the Outreach page. */
export function PipelineBoard() {
  const { prospects, loading } = useProspects()

  const scored = useMemo(() => prospects.map((p) => ({ ...p, _score: score(p), _tier: tierOf(score(p)) })), [prospects])

  if (loading) return <p className="text-sm text-neutral-500">Loading…</p>

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {STATUSES.map(([key, label]) => {
        const col = scored.filter((p) => p.status === key).sort((a, b) => b._score - a._score)
        return (
          <div key={key} className="w-64 shrink-0">
            <div className="flex items-center justify-between px-1 mb-2">
              <h3 className="text-sm font-semibold">{label}</h3>
              <span className="text-xs font-mono text-neutral-500">{col.length}</span>
            </div>
            <div className="space-y-2">
              {col.map((p) => (
                <Link key={p.id} to={`/prospects/${p.id}`} className="block rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 text-sm hover:border-brand-400">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    {p.area} · score {p._score}
                  </div>
                </Link>
              ))}
              {!col.length && <div className="text-xs text-neutral-400 px-1 py-2">Empty</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
