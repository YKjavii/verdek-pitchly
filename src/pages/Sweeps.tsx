import { useState } from 'react'
import { useSweeps, sweepInstructions } from '../hooks/useSweeps'

export default function Sweeps() {
  const { sweeps, loading, requestSweep, markStatus } = useSweeps()
  const [query, setQuery] = useState('')
  const [area, setArea] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setBusy(true)
    try {
      await requestSweep(query.trim(), area)
      setQuery('')
      setArea('')
    } finally {
      setBusy(false)
    }
  }

  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
      /* clipboard may be unavailable; the text is still selectable */
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wide text-neutral-500">Sweeps</div>
        <h1 className="text-2xl font-semibold mt-1">Discovery requests</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Pitchly can't browse Google Maps by itself. Queue a sweep here, copy the instructions, and run it in a
          Claude chat (or hand it to whoever does discovery) — then mark it done once the qualified prospects are
          imported.
        </p>
      </div>

      <form onSubmit={submit} className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 flex flex-col sm:flex-row gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Nail bars" className="input flex-1" />
        <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Area (optional)" className="input sm:w-48" />
        <button disabled={busy || !query.trim()} className="rounded-md bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2">
          Queue sweep
        </button>
      </form>

      <div className="space-y-3">
        {loading && <p className="text-sm text-neutral-500">Loading…</p>}
        {!loading && !sweeps.length && <p className="text-sm text-neutral-500">No sweeps yet.</p>}
        {sweeps.map((s) => (
          <div key={s.id} className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="font-medium">{s.query}</div>
                <div className="text-xs text-neutral-500">{s.area} · requested {new Date(s.requested_at).toLocaleDateString()}</div>
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
            {s.status !== 'done' && (
              <div className="mt-3 rounded-lg bg-neutral-100 dark:bg-neutral-800/60 p-3 text-xs text-neutral-600 dark:text-neutral-300">
                {sweepInstructions(s)}
              </div>
            )}
            <div className="mt-3 flex gap-2">
              {s.status !== 'done' && (
                <button onClick={() => copy(s.id, sweepInstructions(s))} className="text-xs rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1">
                  {copiedId === s.id ? 'Copied!' : 'Copy instructions'}
                </button>
              )}
              {s.status === 'queued' && (
                <button onClick={() => markStatus(s.id, 'running')} className="text-xs rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1">
                  Mark running
                </button>
              )}
              {s.status !== 'done' && (
                <button onClick={() => markStatus(s.id, 'done')} className="text-xs rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1">
                  Mark done
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
