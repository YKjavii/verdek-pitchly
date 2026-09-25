import { useEffect, useState } from 'react'
import { useOrgSettings } from '../hooks/useOrgSettings'
import { useAuth } from '../context/AuthContext'
import { useProspects } from '../hooks/useProspects'
import { useTheme, PALETTES, type MotionMode, type ThemeMode } from '../context/ThemeContext'
import type { PackageDef } from '../lib/types'

type Tab = 'general' | 'offers' | 'appearance' | 'help' | 'about'

const TABS: [Tab, string][] = [
  ['general', 'General'],
  ['offers', 'Offers'],
  ['appearance', 'Appearance'],
  ['help', 'Help'],
  ['about', 'About'],
]

export default function Settings() {
  const [tab, setTab] = useState<Tab>('general')
  const { loading } = useOrgSettings()

  if (loading) return <p className="text-sm text-neutral-500">Loading…</p>

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wide text-neutral-500">Settings</div>
        <h1 className="text-2xl font-semibold mt-1">Make Pitchly yours</h1>
      </div>

      <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`whitespace-nowrap text-sm font-medium px-3 py-2 border-b-2 -mb-px ${
              tab === key ? 'border-brand-600 text-brand-700 dark:text-brand-400' : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'general' && <GeneralTab />}
      {tab === 'offers' && <OffersTab />}
      {tab === 'appearance' && <AppearanceTab />}
      {tab === 'help' && <HelpTab />}
      {tab === 'about' && <AboutTab />}
    </div>
  )
}

function GeneralTab() {
  const { isAdmin } = useAuth()
  const { settings, updateSettings } = useOrgSettings()
  const { prospects } = useProspects()
  const [ownerName, setOwnerName] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) setOwnerName(settings.owner_name)
  }, [settings])

  if (!settings) return null

  const flash = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const saveGeneral = async () => {
    await updateSettings({ owner_name: ownerName })
    flash()
  }

  const exportData = () => {
    const payload = { exported_at: new Date().toISOString(), settings, prospects }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pitchly-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-3">
        <h3 className="font-semibold">Your pitch details</h3>
        <p className="text-sm text-neutral-500">Your name fills every {'{ME}'} token in generated pitches.</p>
        <label className="block text-sm">
          <span className="block mb-1 font-medium">Your name</span>
          <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} onBlur={saveGeneral} className="input" disabled={!isAdmin} />
        </label>
        {!isAdmin && <p className="text-xs text-neutral-500">Only an administrator can change org-wide settings.</p>}
        {saved && <p className="text-xs text-brand-600">Saved</p>}
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-2">
        <h3 className="font-semibold">Export your data</h3>
        <p className="text-sm text-neutral-500">
          Your data already lives in Supabase, not just this browser — this is a personal backup, not something you need to run regularly.
        </p>
        <button onClick={exportData} className="btn-secondary">
          Download JSON backup
        </button>
      </div>
    </div>
  )
}

function OffersTab() {
  const { isAdmin } = useAuth()
  const { settings, updateSettings } = useOrgSettings()
  const [packages, setPackages] = useState<Record<string, PackageDef>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) setPackages(settings.packages)
  }, [settings])

  if (!settings) return null

  const flash = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const savePackage = async (key: string, patch: Partial<PackageDef>) => {
    const next = { ...packages, [key]: { ...packages[key], ...patch } }
    setPackages(next)
    await updateSettings({ packages: next })
    flash()
  }

  const saveItems = async (key: string, text: string) => {
    await savePackage(key, { items: text.split('\n').map((x) => x.trim()).filter(Boolean) })
  }

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-5">
      <div>
        <h3 className="font-semibold">Packages &amp; pricing</h3>
        <p className="text-sm text-neutral-500">
          Fill the {'{PKG}'} and {'{PRICE}'} tokens. Prospects are matched to Starter / Business / Premium by opportunity score.
        </p>
      </div>
      {Object.entries(packages).map(([key, pkg]) => (
        <div key={key} className="border-t border-neutral-100 dark:border-neutral-800 pt-4 first:border-0 first:pt-0 space-y-2">
          <div className="grid sm:grid-cols-3 gap-2">
            <label className="text-sm">
              <span className="block mb-1 font-medium">Name</span>
              <input defaultValue={pkg.name} onBlur={(e) => savePackage(key, { name: e.target.value })} className="input" disabled={!isAdmin} />
            </label>
            <label className="text-sm">
              <span className="block mb-1 font-medium">Price</span>
              <input defaultValue={pkg.price} onBlur={(e) => savePackage(key, { price: e.target.value })} className="input" disabled={!isAdmin} />
            </label>
            <label className="text-sm">
              <span className="block mb-1 font-medium">Delivery</span>
              <input defaultValue={pkg.days} onBlur={(e) => savePackage(key, { days: e.target.value })} className="input" disabled={!isAdmin} />
            </label>
          </div>
          <label className="block text-sm">
            <span className="block mb-1 font-medium">What's included (one per line)</span>
            <textarea defaultValue={pkg.items.join('\n')} onBlur={(e) => saveItems(key, e.target.value)} rows={4} className="input" disabled={!isAdmin} />
          </label>
        </div>
      ))}
      {saved && <p className="text-xs text-brand-600">Saved</p>}
    </div>
  )
}

function AppearanceTab() {
  const { theme, palette, motion, setTheme, setPalette, setMotion } = useTheme()

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-3">
        <h3 className="font-semibold">Theme</h3>
        <div className="flex gap-2">
          {(['light', 'dark', 'system'] as ThemeMode[]).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`text-sm rounded-md px-3 py-1.5 border capitalize ${
                theme === t ? 'bg-brand-600 border-brand-600 text-white' : 'border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <p className="text-xs text-neutral-500">This only affects your own browser — it's not shared with your team.</p>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-3">
        <h3 className="font-semibold">Accent colour</h3>
        <div className="flex flex-wrap gap-2">
          {PALETTES.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPalette(key)}
              className={`flex items-center gap-2 text-sm rounded-md px-3 py-1.5 border ${
                palette === key ? 'border-brand-600 ring-1 ring-brand-600' : 'border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <PaletteSwatch paletteKey={key} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold">Reduce motion</h3>
          <p className="text-sm text-neutral-500 mt-0.5">Turns off non-essential transitions and animations.</p>
        </div>
        <button
          role="switch"
          aria-checked={motion === 'reduce'}
          onClick={() => setMotion((motion === 'reduce' ? 'normal' : 'reduce') as MotionMode)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${motion === 'reduce' ? 'bg-brand-600' : 'bg-neutral-300 dark:bg-neutral-700'}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${motion === 'reduce' ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>
    </div>
  )
}

/** Small colour-chip preview, independent of the currently-applied palette CSS vars. */
function PaletteSwatch({ paletteKey }: { paletteKey: string }) {
  const hexes: Record<string, string> = {
    forest: '#3f7f68',
    ocean: '#14b8a6',
    sunset: '#f97316',
    berry: '#f43f5e',
    slate: '#64748b',
  }
  return <span className="inline-block h-3.5 w-3.5 rounded-full" style={{ background: hexes[paletteKey] || '#999' }} />
}

const FAQ: [string, string][] = [
  ['What counts as a "prospect"?', 'Any real business you or a sweep found on Google Maps, with a name, a rating, and a review count. Pitchly never invents businesses — every fact comes from what you or whoever ran the sweep verified.'],
  ['How is the opportunity score calculated?', "It blends how strong their reviews are (rating and volume) with how big their online-presence gap is (no website scores higher than a weak one, which scores higher than a working site). It's a starting point for triage, not a guarantee."],
  ['What happens when I request a sweep?', "It's logged as a request with a ready-made instruction. Paste that instruction into a Claude chat (or hand it to a teammate) to actually search Google Maps, then add the qualified results and mark the sweep done."],
  ["Why can't sweeps run automatically?", "Google doesn't offer a free bulk search API, and scraping Maps directly breaks Google's terms. Keeping a human in the loop also caught real problems — one sweep found only 12 genuinely qualified prospects out of 654 raw candidates."],
  ["What's the difference between status and qualification?", 'Status is where a prospect sits in your pipeline (contacted, proposal sent, etc). Qualification is your read on how likely they are to buy (hot, warm, price-sensitive, not now, unlikely) — Pitchly uses it to suggest what to do next, and to auto-advance a strong qualification to "Qualified".'],
  ['What happens to a lost prospect\'s data?', "Nothing is deleted. Marking someone lost keeps their full history and adds a reason, which rolls up into the Funnel page so patterns become visible over time."],
  ['Is my data backed up?', "Supabase's own infrastructure is the real backup. Settings > General also has a one-click JSON export if you want your own copy."],
  ['Who can see my data?', "Everyone in your Pitchly org sees the same shared prospects and pipeline — that's the point, so a team can work off one source of truth. Only admins can change packages, pricing, and org settings, or promote/demote teammates."],
]

const TROUBLESHOOTING: [string, string][] = [
  ["A change isn't showing on my other device", 'Check your internet connection — updates sync live over Supabase Realtime the moment they save, so a stale screen almost always means a dropped connection, not a bug.'],
  ["I can't log in", 'Pitchly is invite-only. Ask your admin to send an invite from Supabase (Authentication > Users > Invite user), or to check that your account exists.'],
  ['A follow-up date looks wrong', "Follow-ups are scheduled at 2, 4, 7 and 10 days from when you marked a prospect contacted, and stop the moment they reply."],
  ['Did I lose data switching from the old version?', "No — this version stores everything in a real database instead of one browser's local storage, so refreshing, switching devices, or clearing your browser no longer risks your pipeline."],
]

function HelpTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
        <h3 className="font-semibold mb-3">Frequently asked</h3>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {FAQ.map(([q, a], i) => (
            <details key={i} className="py-3 first:pt-0 last:pb-0">
              <summary className="cursor-pointer text-sm font-medium">{q}</summary>
              <p className="text-sm text-neutral-500 mt-2">{a}</p>
            </details>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
        <h3 className="font-semibold mb-3">Troubleshooting</h3>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {TROUBLESHOOTING.map(([q, a], i) => (
            <details key={i} className="py-3 first:pt-0 last:pb-0">
              <summary className="cursor-pointer text-sm font-medium">{q}</summary>
              <p className="text-sm text-neutral-500 mt-2">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}

function AboutTab() {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-3 text-sm">
      <h3 className="font-semibold text-base">Verdek Pitchly</h3>
      <p className="text-neutral-500">
        Prospect research, outreach, and pipeline tracking for Verdek Studio — built to find local businesses worth pitching, score how warm the
        opportunity is, generate a pitch, and track it through to won or lost.
      </p>
      <p className="text-neutral-500">
        Runs on Supabase (Postgres, Auth, Realtime) and GitHub Pages, entirely on their free tiers — see the project README for the exact limits and
        the one thing to know about a Supabase project pausing after 7 days of no activity.
      </p>
      <p className="text-neutral-500">
        There's no in-app AI assistant yet — the original prototype's chat widget only worked inside claude.ai and would need a paid API connection
        to bring back here. Everything else — scoring, the audit, qualification, objections, follow-ups, the concept generator, and the funnel — is
        fully ported.
      </p>
    </div>
  )
}
