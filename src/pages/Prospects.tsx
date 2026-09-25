import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProspects } from '../hooks/useProspects'
import { score, tierOf, webLabel, TIER_LABEL, type Tier } from '../lib/scoring'
import { STATUSES, statusLabel } from '../lib/types'
import AddProspectDialog from '../components/AddProspectDialog'

export default function Prospects() {
  const { prospects, loading } = useProspects()
  const [q, setQ] = useState('')
  const [area, setArea] = useState('all')
  const [status, setStatus] = useState('all')
  const [tier, setTier] = useState<'all' | Tier>('all')
  const [showAdd, setShowAdd] = useState(false)

  const scored = useMemo(
    () => prospects.map((p) => ({ ...p, _score: score(p), _tier: tierOf(score(p)) })),
    [prospects]
  )
  const areas = useMemo(() => [...new Set(scored.map((p) => p.area))].sort(), [scored])

  const filtered = useMemo(() => {
    const query = q.toLowerCase()
    return scored
      .filter((p) => tier === 'all' || p._tier === tier)
      .filter((p) => area === 'all' || p.area === area)
      .filter((p) => status === 'all' || p.status === status)
      .filter((p) => !query || `${p.name} ${p.area} ${p.phone} ${p.category}`.toLowerCase().includes(query))
      .sort((a, b) => b._score - a._score)
  }, [scored, q, area, status, tier])

  return (
    <div className="max-w-6xl space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">Prospects</div>
          <h1 className="text-2xl font-semibold mt-1">Businesses worth pitching</h1>
          <p className="text-sm text-neutral-500 mt-1">Strong reviews, weak online presence. Ranked by opportunity.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="rounded-md bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 h-fit">
          + Add prospect
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, area or phone"
          className="flex-1 min-w-[200px] rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
        />
        <select value={area} onChange={(e) => setArea(e.target.value)} className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm">
          <option value="all">All areas</option>
          {areas.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm">
          <option value="all">Any status</option>
          {STATUSES.map(([k, l]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['all', 'hot', 'warm', 'cool'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTier(t)}
            className={`whitespace-nowrap text-xs rounded-full px-3 py-1 border ${
              tier === t
                ? 'bg-brand-600 border-brand-600 text-white'
                : 'border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            {t === 'all' ? 'All' : TIER_LABEL[t]} · {t === 'all' ? scored.length : scored.filter((p) => p._tier === t).length}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden">
        {loading && <div className="p-6 text-sm text-neutral-500">Loading…</div>}
        {!loading && !filtered.length && <div className="p-6 text-sm text-neutral-500">No prospects match. Try clearing filters.</div>}
        {filtered.map((p) => (
          <Link
            key={p.id}
            to={`/prospects/${p.id}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 text-sm"
          >
            <span
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                p._tier === 'hot'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                  : p._tier === 'warm'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                    : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
              }`}
              title="Opportunity score"
            >
              {p._score}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{p.name}</div>
              <div className="text-xs text-neutral-500">{p.area} · {p.rating.toFixed(1)} ★ {p.reviews}</div>
            </div>
            <span className="hidden sm:inline text-xs rounded-full px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
              {webLabel(p)}
            </span>
            {p.status !== 'new' && (
              <span className="text-xs rounded-full px-2 py-0.5 bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                {statusLabel(p.status)}
              </span>
            )}
          </Link>
        ))}
      </div>

      {showAdd && <AddProspectDialog onClose={() => setShowAdd(false)} />}
    </div>
  )
}
