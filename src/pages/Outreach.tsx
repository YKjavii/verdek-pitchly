import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProspects } from '../hooks/useProspects'
import { useOrgSettings } from '../hooks/useOrgSettings'
import { score } from '../lib/scoring'
import { genFollowUp, genPitch } from '../lib/pitch'
import { audit } from '../lib/audit'
import { dueFollowups, markFuSentPatch, FU_LABEL } from '../lib/followups'
import { stampEvent } from '../lib/stage'
import { addDays, fmtShortDate, waLink } from '../lib/utils'
import type { OrgSettings, Prospect } from '../lib/types'
import { PipelineBoard } from './Pipeline'

type Tab = 'queue' | 'followups' | 'pipeline'

export default function Outreach() {
  const [tab, setTab] = useState<Tab>('queue')
  const { prospects } = useProspects()
  const dueNow = dueFollowups(prospects).filter((x) => x.f.overdue).length

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs uppercase tracking-wide text-neutral-500">Outreach</div>
        <h1 className="text-2xl font-semibold mt-1">Pitch, follow up, close</h1>
        <p className="text-sm text-neutral-500 mt-1">Personalised messages for each business, follow-ups on a schedule, and every conversation tracked to a result.</p>
      </div>
      <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800">
        {(
          [
            ['queue', 'Queue'],
            ['followups', `Follow-ups${dueNow ? ` (${dueNow})` : ''}`],
            ['pipeline', 'Pipeline'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`text-sm font-medium px-3 py-2 border-b-2 -mb-px ${
              tab === key ? 'border-brand-600 text-brand-700 dark:text-brand-400' : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'queue' && <QueueTab />}
      {tab === 'followups' && <FollowupsTab />}
      {tab === 'pipeline' && <PipelineBoard />}
    </div>
  )
}

function QueueTab() {
  const { prospects, updateProspect } = useProspects()
  const { settings } = useOrgSettings()
  const [skipped, setSkipped] = useState<Set<string>>(new Set())

  const queue = useMemo(() => {
    const untouched = prospects.filter((p) => p.status === 'new').map((p) => ({ ...p, _score: score(p) })).sort((a, b) => b._score - a._score)
    // session-only reorder: skipped prospects move behind everything else, in the order skipped
    const notSkipped = untouched.filter((p) => !skipped.has(p.id))
    const isSkipped = untouched.filter((p) => skipped.has(p.id))
    return [...notSkipped, ...isSkipped]
  }, [prospects, skipped])

  if (!settings) return <p className="text-sm text-neutral-500">Loading…</p>

  if (!queue.length) {
    return (
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 text-center">
        <h3 className="font-semibold">You've contacted every prospect</h3>
        <p className="text-sm text-neutral-500 mt-1">Nice work. Check the Follow-ups tab, or request a new sweep from the Dashboard.</p>
        <Link to="/" className="inline-block mt-3 btn-primary">
          Back to dashboard
        </Link>
      </div>
    )
  }

  const p = queue[0]
  const a = audit(p)
  const pitch = p.pitch || genPitch(p, settings)
  const wa = p.phone ? waLink(p.phone, pitch) : ''
  const ig = p.instagram ? `https://www.instagram.com/${p.instagram}/` : ''

  const markContacted = async () => {
    await updateProspect(
      p.id,
      { status: 'contacted', contacted_at: new Date().toISOString(), follow_up_date: addDays(2), events: stampEvent(p.events, 'contacted') },
      'Marked contacted'
    )
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pitch)
    } catch {
      /* clipboard may be unavailable */
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-3">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>{queue.length - 1} after this</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 text-sm font-semibold">
            {p._score}
          </span>
          <div>
            <div className="text-xs text-neutral-500">
              {p.area} · {a.kindLabel}
            </div>
            <h2 className="text-lg font-semibold">{p.name}</h2>
            <div className="text-xs text-neutral-500">
              {p.rating.toFixed(1)} ★ · {p.reviews} reviews
            </div>
          </div>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{a.opportunity}</p>
        <label className="block text-sm">
          <span className="block mb-1 font-medium">First message</span>
          <textarea
            defaultValue={pitch}
            onBlur={(e) => e.target.value !== p.pitch && updateProspect(p.id, { pitch: e.target.value })}
            rows={5}
            className="input"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button onClick={copy} className="btn-secondary">
            Copy message
          </button>
          {wa && (
            <a className="btn-secondary" target="_blank" rel="noreferrer" href={wa}>
              WhatsApp
            </a>
          )}
          {ig && (
            <a className="btn-secondary" target="_blank" rel="noreferrer" href={ig}>
              Instagram
            </a>
          )}
          {p.phone && (
            <a className="btn-secondary" href={`tel:${p.phone}`}>
              Call
            </a>
          )}
        </div>
        {!wa && !ig && <p className="text-xs text-neutral-500">No phone or Instagram on file. Copy the message and send it wherever you reach them.</p>}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button onClick={markContacted} className="btn-primary">
            Mark contacted, next
          </button>
          <button onClick={() => setSkipped((s) => new Set(s).add(p.id))} className="btn-secondary">
            Skip for now
          </button>
          <Link to={`/prospects/${p.id}`} className="btn-secondary">
            Full profile
          </Link>
        </div>
      </section>
      <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
        <h3 className="font-semibold mb-2">Up next</h3>
        <div className="space-y-2">
          {queue.slice(1, 6).map((x) => (
            <Link key={x.id} to={`/prospects/${x.id}`} className="flex items-center justify-between text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800/60 -mx-2 px-2 py-1.5 rounded">
              <span className="truncate">{x.name}</span>
              <span className="text-xs text-neutral-500 shrink-0 ml-2">{x.area}</span>
            </Link>
          ))}
          {queue.length <= 1 && <p className="text-sm text-neutral-500">This is the last untouched prospect.</p>}
        </div>
      </section>
    </div>
  )
}

function FollowupsTab() {
  const { prospects, updateProspect } = useProspects()
  const { settings } = useOrgSettings()
  const due = dueFollowups(prospects)

  if (!settings) return <p className="text-sm text-neutral-500">Loading…</p>
  if (!due.length) {
    return (
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 text-center">
        <h3 className="font-semibold">No follow-ups scheduled</h3>
        <p className="text-sm text-neutral-500 mt-1">Once you mark a message sent, follow-ups appear here at 2, 4, 7 and 10 days. They stop as soon as someone replies.</p>
      </div>
    )
  }

  const now = due.filter((x) => x.f.overdue)
  const later = due.filter((x) => !x.f.overdue)

  return (
    <div className="space-y-4">
      {now.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">
            Due now <span className="text-neutral-400 font-mono">{now.length}</span>
          </h3>
          {now.map((x) => (
            <FollowupRow key={x.p.id} p={x.p} step={x.f.step} due={x.f.due} overdue={x.f.overdue} settings={settings} onSent={updateProspect} />
          ))}
        </div>
      )}
      {later.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">
            Coming up <span className="text-neutral-400 font-mono">{later.length}</span>
          </h3>
          {later.map((x) => (
            <FollowupRow key={x.p.id} p={x.p} step={x.f.step} due={x.f.due} overdue={x.f.overdue} settings={settings} onSent={updateProspect} />
          ))}
        </div>
      )}
    </div>
  )
}

function FollowupRow({
  p,
  step,
  due: dueDate,
  overdue,
  settings,
  onSent,
}: {
  p: Prospect
  step: number
  due: string
  overdue: boolean
  settings: OrgSettings
  onSent: (id: string, patch: Partial<Prospect>, logText?: string) => Promise<void>
}) {
  const msg = genFollowUp(p, step, settings)
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-2">
      <div className="flex items-center gap-2 flex-wrap text-sm">
        <span className={`text-xs rounded-full px-2 py-0.5 ${overdue ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'}`}>
          {overdue ? 'Due now' : `Due ${fmtShortDate(dueDate)}`}
        </span>
        <b>{p.name}</b>
        <span className="text-neutral-500 text-xs">
          Follow-up {step + 1} of 4 · {FU_LABEL[step]}
        </span>
      </div>
      <textarea value={msg} rows={3} className="input" readOnly />
      <div className="flex flex-wrap gap-2">
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(msg)
            } catch {
              /* ignore */
            }
          }}
          className="btn-secondary"
        >
          Copy message
        </button>
        {p.phone && (
          <a className="btn-secondary" target="_blank" rel="noreferrer" href={waLink(p.phone, msg)}>
            WhatsApp
          </a>
        )}
        <button onClick={() => onSent(p.id, markFuSentPatch(p), 'Follow-up sent')} className="btn-primary">
          Mark sent
        </button>
        <Link to={`/prospects/${p.id}`} className="btn-secondary">
          They replied
        </Link>
      </div>
    </div>
  )
}
