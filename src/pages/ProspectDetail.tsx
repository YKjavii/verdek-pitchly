import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useProspects } from '../hooks/useProspects'
import { useActivityLog } from '../hooks/useActivityLog'
import { useOrgSettings } from '../hooks/useOrgSettings'
import { score, tierOf, webLabel } from '../lib/scoring'
import { genPitch } from '../lib/pitch'
import { STATUSES, statusLabel, type Status } from '../lib/types'
import { fbUrl, waLink, addDays } from '../lib/utils'

export default function ProspectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { prospects, updateProspect, deleteProspect, loading } = useProspects()
  const { settings } = useOrgSettings()
  const prospect = prospects.find((p) => p.id === id)
  const { entries } = useActivityLog(id ?? null)

  const [notes, setNotes] = useState('')
  const [pitch, setPitch] = useState('')
  const [copyLabel, setCopyLabel] = useState('Copy pitch')

  useEffect(() => {
    if (prospect) {
      setNotes(prospect.notes || '')
      setPitch(prospect.pitch || (settings ? genPitch(prospect, settings) : ''))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospect?.id, settings?.org_id])

  if (loading) return <p className="text-sm text-neutral-500">Loading…</p>
  if (!prospect) return <p className="text-sm text-neutral-500">Prospect not found. <Link to="/prospects" className="text-brand-600 hover:underline">Back to prospects</Link></p>

  const s = score(prospect)
  const tier = tierOf(s)

  const saveNotes = async () => {
    await updateProspect(prospect.id, { notes })
  }

  const savePitch = async () => {
    await updateProspect(prospect.id, { pitch })
  }

  const changeStatus = async (next: Status) => {
    if (next === 'contacted' && prospect.status === 'new') {
      await updateProspect(
        prospect.id,
        { status: 'contacted', contacted_at: new Date().toISOString(), follow_up_date: addDays(2) },
        'Marked contacted'
      )
      return
    }
    await updateProspect(prospect.id, { status: next }, `Status → ${statusLabel(next)}`)
  }

  const copyPitch = async () => {
    try {
      await navigator.clipboard.writeText(pitch)
      setCopyLabel('Copied!')
      setTimeout(() => setCopyLabel('Copy pitch'), 1500)
      if (pitch !== prospect.pitch) await savePitch()
    } catch {
      setCopyLabel("Couldn't copy")
    }
  }

  const del = async () => {
    if (!confirm(`Delete ${prospect.name}? This can't be undone.`)) return
    await deleteProspect(prospect.id)
    navigate('/prospects')
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Link to="/prospects" className="text-sm text-brand-600 hover:underline">← Back to prospects</Link>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{prospect.name}</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {prospect.category} · {prospect.area} {prospect.address && `· ${prospect.address}`}
          </p>
        </div>
        <span
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
            tier === 'hot'
              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
              : tier === 'warm'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
          }`}
        >
          {s}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <InfoRow label="Rating">{prospect.rating.toFixed(1)} ★ · {prospect.reviews} reviews</InfoRow>
        <InfoRow label="Web presence">{webLabel(prospect)}{prospect.website_url && <> — <a className="text-brand-600 hover:underline" href={/^https?:/.test(prospect.website_url) ? prospect.website_url : `https://${prospect.website_url}`} target="_blank" rel="noreferrer">{prospect.website_url}</a></>}</InfoRow>
        <InfoRow label="Phone">
          {prospect.phone || '—'}
          {prospect.phone && (
            <a className="ml-2 text-brand-600 hover:underline" href={waLink(prospect.phone, pitch)} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          )}
        </InfoRow>
        <InfoRow label="Social">
          {prospect.instagram && <a className="text-brand-600 hover:underline mr-3" href={`https://instagram.com/${prospect.instagram}`} target="_blank" rel="noreferrer">Instagram</a>}
          {prospect.facebook && <a className="text-brand-600 hover:underline" href={fbUrl(prospect.facebook)} target="_blank" rel="noreferrer">Facebook</a>}
          {!prospect.instagram && !prospect.facebook && '—'}
        </InfoRow>
      </div>

      {prospect.website_note && (
        <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800/60 p-3 text-sm text-neutral-600 dark:text-neutral-300">
          {prospect.website_note}
        </div>
      )}

      {!!prospect.signals?.length && (
        <ul className="flex flex-wrap gap-2">
          {prospect.signals.map((sig, i) => (
            <li key={i} className="text-xs rounded-full px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
              {sig}
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-semibold">Status</h3>
          <select
            value={prospect.status}
            onChange={(e) => changeStatus(e.target.value as Status)}
            className="input w-auto"
          >
            {STATUSES.map(([k, l]) => (
              <option key={k} value={k}>{l}</option>
            ))}
          </select>
        </div>
        <label className="block text-sm">
          <span className="block mb-1 font-medium">Follow-up date</span>
          <input
            type="date"
            value={prospect.follow_up_date ?? ''}
            onChange={(e) => updateProspect(prospect.id, { follow_up_date: e.target.value || null })}
            className="input w-auto"
          />
        </label>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Pitch message</h3>
          <div className="flex gap-2">
            <button
              onClick={() => settings && setPitch(genPitch(prospect, settings))}
              className="text-xs text-brand-600 hover:underline"
            >
              Regenerate
            </button>
            <button onClick={copyPitch} className="text-xs rounded-md bg-brand-600 hover:bg-brand-700 text-white px-3 py-1">
              {copyLabel}
            </button>
          </div>
        </div>
        <textarea
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          onBlur={savePitch}
          rows={5}
          className="input"
        />
        <p className="text-xs text-neutral-500">Keep the {'{ME}'}, {'{PKG}'}, {'{PRICE}'} tokens if you want them filled from Settings automatically.</p>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-2">
        <h3 className="font-semibold">Notes</h3>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes} rows={4} className="input" placeholder="Private notes about this prospect…" />
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
        <h3 className="font-semibold mb-2">Activity</h3>
        {!entries.length && <p className="text-sm text-neutral-500">Nothing logged yet.</p>}
        <ul className="space-y-2">
          {entries.map((e) => (
            <li key={e.id} className="text-sm">
              <span className="text-neutral-500 text-xs mr-2">{new Date(e.created_at).toLocaleString()}</span>
              {e.text}
            </li>
          ))}
        </ul>
      </div>

      <button onClick={del} className="text-xs text-red-600 hover:underline">
        Delete prospect
      </button>
    </div>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3">
      <div className="text-xs text-neutral-500 mb-0.5">{label}</div>
      <div>{children}</div>
    </div>
  )
}
