import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useProspects } from '../hooks/useProspects'
import { useActivityLog } from '../hooks/useActivityLog'
import { useOrgSettings } from '../hooks/useOrgSettings'
import { score, tierOf, webLabel } from '../lib/scoring'
import { genPitch, recommendPackageKey } from '../lib/pitch'
import { audit } from '../lib/audit'
import { QUAL, type QualKey, QUALIFIES_AS_QUALIFIED } from '../lib/qualification'
import { objectionOf } from '../lib/objections'
import { lossLabel } from '../lib/loss'
import { fuState, markFuSentPatch } from '../lib/followups'
import { stampEvent } from '../lib/stage'
import { defaultConceptOptions, type ConceptOptions } from '../lib/concept'
import { STATUSES, statusLabel, type Prospect, type Status } from '../lib/types'
import { fbUrl, waLink, addDays } from '../lib/utils'
import QualificationPicker from '../components/QualificationPicker'
import ObjectionPicker from '../components/ObjectionPicker'
import FollowupTimeline from '../components/FollowupTimeline'
import ConceptDialog from '../components/ConceptDialog'
import LostDialog from '../components/LostDialog'
import WonDialog from '../components/WonDialog'

const JOURNEY: Status[] = ['new', 'contacted', 'replied', 'interested', 'qualified', 'mockup', 'proposal', 'won']

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
  const [showConcept, setShowConcept] = useState(false)
  const [showLost, setShowLost] = useState(false)
  const [showWon, setShowWon] = useState(false)

  useEffect(() => {
    if (prospect) {
      setNotes(prospect.notes || '')
      setPitch(prospect.pitch || (settings ? genPitch(prospect, settings) : ''))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospect?.id, settings?.org_id])

  if (loading) return <p className="text-sm text-neutral-500">Loading…</p>
  if (!prospect || !settings)
    return (
      <p className="text-sm text-neutral-500">
        Prospect not found. <Link to="/prospects" className="text-brand-600 hover:underline">Back to prospects</Link>
      </p>
    )

  const s = score(prospect)
  const tier = tierOf(s)
  const a = audit(prospect)
  const pkgKey = recommendPackageKey(prospect)
  const pkg = settings.packages[pkgKey]
  const fu = fuState(prospect)
  const showQualAndObjection = ['replied', 'interested', 'qualified', 'mockup', 'proposal'].includes(prospect.status)

  const setStage = async (next: Status, extraPatch: Partial<Prospect> = {}, logText?: string) => {
    const patch: Partial<Prospect> = { status: next, events: stampEvent(prospect.events, next), ...extraPatch }
    if (next === 'contacted' && !prospect.contacted_at) {
      patch.contacted_at = new Date().toISOString()
      if (!patch.follow_up_date) patch.follow_up_date = addDays(2)
    }
    await updateProspect(prospect.id, patch, logText ?? `Status → ${statusLabel(next)}`)
  }

  const handleStatusSelect = (next: Status) => {
    if (next === 'won') return setShowWon(true)
    if (next === 'lost') return setShowLost(true)
    setStage(next)
  }

  const setQualification = async (key: QualKey) => {
    const patch: Partial<Prospect> = { qualification: key }
    if (key === 'later' && !prospect.follow_up_date) patch.follow_up_date = addDays(14)
    if (QUALIFIES_AS_QUALIFIED.includes(key) && prospect.status !== 'qualified' && !['mockup', 'proposal', 'won', 'lost'].includes(prospect.status)) {
      await setStage('qualified', patch, `Qualified: ${QUAL[key].label}`)
    } else {
      await updateProspect(prospect.id, patch, `Qualification: ${QUAL[key].label}`)
    }
  }

  const toggleObjection = async (key: string) => {
    const next = prospect.objection === key ? '' : key
    await updateProspect(prospect.id, { objection: next }, next ? `Blocker: ${objectionOf(next)?.label}` : 'Blocker cleared')
  }

  const markFuSent = async () => {
    await updateProspect(prospect.id, markFuSentPatch(prospect), 'Follow-up sent')
  }

  const saveConcept = async (opts: ConceptOptions) => {
    await updateProspect(prospect.id, { concept: opts })
  }

  const markConceptSent = async (opts: ConceptOptions) => {
    await updateProspect(prospect.id, { concept: opts })
    if (!['mockup', 'proposal', 'won', 'lost'].includes(prospect.status)) {
      await setStage('mockup', {}, 'Concept sent')
    }
    setShowConcept(false)
  }

  const saveNotes = async () => {
    await updateProspect(prospect.id, { notes })
  }

  const savePitch = async () => {
    await updateProspect(prospect.id, { pitch })
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

  const conceptOpts = (prospect.concept as ConceptOptions | null) ?? defaultConceptOptions(prospect)

  return (
    <div className="max-w-4xl space-y-6">
      <Link to="/prospects" className="text-sm text-brand-600 hover:underline">
        ← Back to prospects
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{prospect.name}</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {a.kindLabel} · {prospect.area} {prospect.address && `· ${prospect.address}`}
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

      {/* Journey stepper */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {JOURNEY.map((st, i) => {
          const idx = JOURNEY.indexOf(prospect.status)
          const state = prospect.status === 'lost' ? 'lost' : i < idx ? 'done' : i === idx ? 'current' : 'todo'
          return (
            <div key={st} className="flex items-center shrink-0">
              <span
                className={`text-[11px] whitespace-nowrap rounded-full px-2.5 py-1 font-medium ${
                  state === 'current'
                    ? 'bg-brand-600 text-white'
                    : state === 'done'
                      ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                      : state === 'lost'
                        ? 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800'
                        : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'
                }`}
              >
                {statusLabel(st)}
              </span>
              {i < JOURNEY.length - 1 && <span className="w-3 h-px bg-neutral-300 dark:bg-neutral-700 mx-0.5" />}
            </div>
          )
        })}
        {prospect.status === 'lost' && <span className="text-[11px] rounded-full px-2.5 py-1 font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">Lost</span>}
      </div>

      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <InfoRow label="Rating">
          {prospect.rating.toFixed(1)} ★ · {prospect.reviews} reviews
        </InfoRow>
        <InfoRow label="Web presence">
          {webLabel(prospect)}
          {prospect.website_url && (
            <>
              {' '}
              —{' '}
              <a className="text-brand-600 hover:underline" href={/^https?:/.test(prospect.website_url) ? prospect.website_url : `https://${prospect.website_url}`} target="_blank" rel="noreferrer">
                {prospect.website_url}
              </a>
            </>
          )}
        </InfoRow>
        <InfoRow label="Phone">
          {prospect.phone || '—'}
          {prospect.phone && (
            <a className="ml-2 text-brand-600 hover:underline" href={waLink(prospect.phone, pitch)} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          )}
        </InfoRow>
        <InfoRow label="Social">
          {prospect.instagram && (
            <a className="text-brand-600 hover:underline mr-3" href={`https://instagram.com/${prospect.instagram}`} target="_blank" rel="noreferrer">
              Instagram
            </a>
          )}
          {prospect.facebook && (
            <a className="text-brand-600 hover:underline" href={fbUrl(prospect.facebook)} target="_blank" rel="noreferrer">
              Facebook
            </a>
          )}
          {!prospect.instagram && !prospect.facebook && '—'}
        </InfoRow>
      </div>

      {!!prospect.signals?.length && (
        <ul className="flex flex-wrap gap-2">
          {prospect.signals.map((sig, i) => (
            <li key={i} className="text-xs rounded-full px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
              {sig}
            </li>
          ))}
        </ul>
      )}

      {/* Opportunity audit */}
      <Card title="Opportunity">
        <p className="text-sm leading-relaxed">{a.opportunity}</p>
        <dl className="text-sm mt-3 space-y-1.5">
          <Row k="Website status">{a.websiteDetail}</Row>
          <Row k="Social">{a.social}</Row>
          <Row k="Recommendation">{a.service}</Row>
        </dl>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-brand-600 hover:underline">Before you pitch, verify…</summary>
          <ul className="list-disc list-inside mt-2 space-y-1 text-neutral-600 dark:text-neutral-400">
            {a.checklist.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </details>
      </Card>

      {/* Recommended offer */}
      <Card title="Recommended offer">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="font-semibold">{pkg?.name}</div>
            <div className="text-sm text-neutral-500">
              {pkg?.price} · {pkg?.days}
            </div>
          </div>
          <Link to="/settings" className="text-xs text-brand-600 hover:underline">
            Edit packages
          </Link>
        </div>
        {!!pkg?.items?.length && (
          <ul className="text-sm text-neutral-500 list-disc list-inside mt-2">
            {pkg.items.map((it, i) => (
              <li key={i}>{it}</li>
            ))}
          </ul>
        )}
      </Card>

      {/* Stage actions */}
      <Card title="Move it forward">
        {prospect.status === 'new' && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setStage('contacted')} className="btn-primary">
              Mark as contacted
            </button>
          </div>
        )}
        {prospect.status === 'contacted' && (
          <div className="space-y-3">
            <FollowupTimeline prospect={prospect} />
            {fu && !fu.done && fu.overdue && (
              <button onClick={markFuSent} className="btn-secondary">
                Mark follow-up sent
              </button>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <button onClick={() => setStage('interested', { follow_up_date: null }, 'Positive reply')} className="btn-primary">
                They replied positively
              </button>
              <button onClick={() => setStage('replied', { follow_up_date: null }, 'Replied')} className="btn-secondary">
                They replied
              </button>
              <button onClick={() => setShowLost(true)} className="btn-danger">
                They said no
              </button>
            </div>
          </div>
        )}
        {['replied', 'interested'].includes(prospect.status) && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setStage('qualified')} className="btn-secondary">
              Mark qualified
            </button>
            <button onClick={() => setShowLost(true)} className="btn-danger">
              They said no
            </button>
          </div>
        )}
        {prospect.status === 'qualified' && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowConcept(true)} className="btn-primary">
              {prospect.concept ? 'Reopen website concept' : 'Send website concept'}
            </button>
            <button onClick={() => setStage('proposal')} className="btn-secondary">
              Send proposal
            </button>
          </div>
        )}
        {prospect.status === 'mockup' && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowConcept(true)} className="btn-secondary">
              Reopen website concept
            </button>
            <button onClick={() => setStage('proposal')} className="btn-primary">
              Send proposal
            </button>
          </div>
        )}
        {prospect.status === 'proposal' && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowWon(true)} className="btn-primary">
              Mark won
            </button>
            <button onClick={() => setShowLost(true)} className="btn-danger">
              Mark lost
            </button>
          </div>
        )}
        {prospect.status === 'won' && (
          <div className="space-y-2">
            <p className="text-sm">
              Won{prospect.package ? ` · ${settings.packages[prospect.package]?.name ?? prospect.package}` : ''}
              {prospect.won_value ? ` · JMD ${Number(prospect.won_value).toLocaleString()}` : ''}
            </p>
            <button onClick={() => setStage('contacted')} className="btn-secondary">
              Reopen
            </button>
          </div>
        )}
        {prospect.status === 'lost' && (
          <div className="space-y-2">
            <p className="text-sm">
              Lost{prospect.lost_reason ? ` · ${lossLabel(prospect.lost_reason)}` : ''}
              {prospect.lost_note ? ` — ${prospect.lost_note}` : ''}
            </p>
            <button onClick={() => setStage('contacted', { lost_reason: '', lost_note: '' }, 'Reopened')} className="btn-secondary">
              Reopen
            </button>
          </div>
        )}
      </Card>

      {showQualAndObjection && (
        <Card title="Qualification">
          <QualificationPicker value={prospect.qualification} onChange={setQualification} />
        </Card>
      )}

      {showQualAndObjection && (
        <Card title="Blockers">
          <ObjectionPicker prospect={prospect} settings={settings} onChange={toggleObjection} />
        </Card>
      )}

      {/* Pitch message */}
      <Card
        title="First message"
        action={
          <div className="flex gap-2">
            <button onClick={() => settings && setPitch(genPitch(prospect, settings))} className="text-xs text-brand-600 hover:underline">
              Reset text
            </button>
            <button onClick={copyPitch} className="text-xs rounded-md bg-brand-600 hover:bg-brand-700 text-white px-3 py-1">
              {copyLabel}
            </button>
          </div>
        }
      >
        <textarea value={pitch} onChange={(e) => setPitch(e.target.value)} onBlur={savePitch} rows={5} className="input" />
        <p className="text-xs text-neutral-500 mt-1">
          Keep the {'{ME}'}, {'{PKG}'}, {'{PRICE}'} tokens if you want them filled from Settings automatically.
        </p>
      </Card>

      {/* Track and notes */}
      <Card title="Track and notes">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <span className="text-sm font-medium">Status</span>
          <select value={prospect.status} onChange={(e) => handleStatusSelect(e.target.value as Status)} className="input w-auto">
            {STATUSES.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <label className="block text-sm mb-3">
          <span className="block mb-1 font-medium">Follow-up date</span>
          <input
            type="date"
            value={prospect.follow_up_date ?? ''}
            onChange={(e) => updateProspect(prospect.id, { follow_up_date: e.target.value || null })}
            className="input w-auto"
          />
        </label>
        <label className="block text-sm">
          <span className="block mb-1 font-medium">Notes</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes} rows={4} className="input" placeholder="What they said, what they want, prices discussed…" />
        </label>
      </Card>

      <Card title="Activity">
        {!entries.length && <p className="text-sm text-neutral-500">Nothing logged yet.</p>}
        <ul className="space-y-2">
          {entries.map((e) => (
            <li key={e.id} className="text-sm">
              <span className="text-neutral-500 text-xs mr-2">{new Date(e.created_at).toLocaleString()}</span>
              {e.text}
            </li>
          ))}
        </ul>
      </Card>

      <button onClick={del} className="text-xs text-red-600 hover:underline">
        Delete prospect
      </button>

      {showConcept && (
        <ConceptDialog
          prospect={prospect}
          initial={conceptOpts}
          alreadySent={!!prospect.events?.mockup}
          onSave={saveConcept}
          onMarkSent={markConceptSent}
          onClose={() => setShowConcept(false)}
        />
      )}
      {showLost && (
        <LostDialog
          name={prospect.name}
          initialReason={prospect.lost_reason}
          initialNote={prospect.lost_note}
          onSubmit={(reason, note) => setStage('lost', { lost_reason: reason, lost_note: note, follow_up_date: null }, `Lost: ${lossLabel(reason)}`)}
          onClose={() => setShowLost(false)}
        />
      )}
      {showWon && (
        <WonDialog
          prospect={prospect}
          settings={settings}
          onSubmit={(pkg, value) => setStage('won', { package: pkg, won_value: value, follow_up_date: null }, `Won: JMD ${value.toLocaleString()}`)}
          onClose={() => setShowWon(false)}
        />
      )}
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

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="text-neutral-500 shrink-0 w-32">{k}</dt>
      <dd>{children}</dd>
    </div>
  )
}
