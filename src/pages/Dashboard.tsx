import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProspects } from '../hooks/useProspects'
import { useSweeps } from '../hooks/useSweeps'
import { useAuth } from '../context/AuthContext'
import { score, tierOf } from '../lib/scoring'
import { statusLabel } from '../lib/types'
import { today } from '../lib/utils'

const NICHE_CHIPS = ['Salons & barbers', 'Nail bars', 'Spas', 'Hair braiding', 'Restaurants', 'Auto repair shops']
const AREAS = ['Kingston', 'Montego Bay', 'Ocho Rios', 'Portmore', 'Mandeville', 'Negril']

export default function Dashboard() {
  const { profile } = useAuth()
  const { prospects, loading } = useProspects()
  const { sweeps, requestSweep } = useSweeps()
  const [query, setQuery] = useState('')
  const [area, setArea] = useState('')
  const [busy, setBusy] = useState(false)

  const scored = useMemo(() => prospects.map((p) => ({ ...p, _score: score(p), _tier: tierOf(score(p)) })), [prospects])

  const due = scored.filter((p) => p.follow_up_date && p.follow_up_date <= today() && !['won', 'lost', 'new'].includes(p.status))
  const replied = scored.filter((p) => p.status === 'replied')
  const untouched = scored.filter((p) => p.status === 'new').sort((a, b) => b._score - a._score)

  const greeting = () => {
    const h = new Date().getHours()
    const name = profile?.display_name || 'there'
    return `${h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'}, ${name}`
  }

  const nextBest = () => {
    if (due.length) return { title: `Follow up with ${due[0].name}`, body: `Follow-up was due ${due[0].follow_up_date}.`, to: `/prospects/${due[0].id}` }
    if (replied.length) return { title: `${replied[0].name} replied`, body: 'Send the free homepage concept while interest is high.', to: `/prospects/${replied[0].id}` }
    if (untouched.length)
      return {
        title: untouched[0].name,
        body: `Best untouched prospect by opportunity score (${untouched[0]._score}). ${untouched.length - 1} more waiting.`,
        to: `/prospects/${untouched[0].id}`,
      }
    return { title: 'Every prospect has been contacted', body: 'Request a new sweep below to find more.', to: '/prospects' }
  }

  const nb = nextBest()

  const submitSweep = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setBusy(true)
    try {
      await requestSweep(query.trim(), area)
      setQuery('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wide text-neutral-500">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        <h1 className="text-2xl font-semibold mt-1">{greeting()}</h1>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
        <div className="text-xs uppercase tracking-wide text-brand-600 font-medium">Next best action</div>
        <h2 className="text-lg font-semibold mt-1">{nb.title}</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{nb.body}</p>
        <Link to={nb.to} className="inline-block mt-3 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2">
          Open →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Prospects" value={loading ? '…' : prospects.length} />
        <Stat label="Contacted" value={loading ? '…' : prospects.filter((p) => p.status !== 'new').length} />
        <Stat label="Replied" value={loading ? '…' : prospects.filter((p) => p.status === 'replied').length} />
        <Stat label="Won" value={loading ? '…' : prospects.filter((p) => p.status === 'won').length} />
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
        <h3 className="font-semibold">Request a new sweep</h3>
        <p className="text-sm text-neutral-500 mt-1">
          Pitchly can't browse the web itself. Requesting a sweep here queues it — then paste the instructions into a
          Claude chat (or hand them to whoever runs sweeps) to actually search Google Maps and import results.
        </p>
        <form onSubmit={submitSweep} className="flex flex-col sm:flex-row gap-2 mt-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Salons & barbers"
            className="flex-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
          />
          <select value={area} onChange={(e) => setArea(e.target.value)} className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm">
            <option value="">Anywhere in Jamaica</option>
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <button disabled={busy || !query.trim()} className="rounded-md bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2">
            Queue sweep
          </button>
        </form>
        <div className="flex flex-wrap gap-2 mt-3">
          {NICHE_CHIPS.map((n) => (
            <button
              key={n}
              onClick={() => setQuery(n)}
              className="text-xs rounded-full border border-neutral-300 dark:border-neutral-700 px-3 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Recent sweeps</h3>
          <Link to="/sweeps" className="text-sm text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {sweeps.slice(0, 4).map((s) => (
            <div key={s.id} className="flex items-center justify-between text-sm border-b border-neutral-100 dark:border-neutral-800 last:border-0 py-2">
              <div>
                <div className="font-medium">{s.query}</div>
                <div className="text-neutral-500 text-xs">{s.area}</div>
              </div>
              <span
                className={`text-xs rounded-full px-2 py-0.5 ${
                  s.status === 'done'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : s.status === 'failed'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                      : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                }`}
              >
                {s.status === 'done' ? `${s.count} added` : s.status}
              </span>
            </div>
          ))}
          {!sweeps.length && <p className="text-sm text-neutral-500">No sweeps yet.</p>}
        </div>
      </div>

      {due.length > 0 && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <h3 className="font-semibold">Needs attention</h3>
          <div className="mt-3 space-y-2">
            {due.slice(0, 5).map((p) => (
              <Link
                key={p.id}
                to={`/prospects/${p.id}`}
                className="flex items-center justify-between text-sm border-b border-neutral-100 dark:border-neutral-800 last:border-0 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 -mx-2 px-2 rounded"
              >
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-neutral-500 text-xs">{statusLabel(p.status)} · follow-up due {p.follow_up_date}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-neutral-500">
        Copy-pasteable sweep instructions live on the <Link to="/sweeps" className="text-brand-600 hover:underline">Sweeps</Link> page.
      </p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
      <div className="text-2xl font-semibold font-mono">{value}</div>
      <div className="text-xs text-neutral-500 mt-0.5">{label}</div>
    </div>
  )
}
