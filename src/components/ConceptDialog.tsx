import { useEffect, useState } from 'react'
import type { Prospect } from '../lib/types'
import { CONCEPT_STYLES, conceptHtml, defaultConceptOptions, type ConceptOptions } from '../lib/concept'

export default function ConceptDialog({
  prospect,
  initial,
  alreadySent,
  onSave,
  onMarkSent,
  onClose,
}: {
  prospect: Prospect
  initial: ConceptOptions | null
  alreadySent: boolean
  onSave: (opts: ConceptOptions) => void | Promise<void>
  onMarkSent: (opts: ConceptOptions) => void | Promise<void>
  onClose: () => void
}) {
  const [opts, setOpts] = useState<ConceptOptions>(initial ?? defaultConceptOptions(prospect))
  const [preview, setPreview] = useState('')
  const [phone, setPhone] = useState<'desktop' | 'phone'>('desktop')
  const [copyLabel, setCopyLabel] = useState('Copy page HTML')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setPreview(conceptHtml(prospect, opts)), 200)
    return () => clearTimeout(t)
  }, [prospect, opts])

  const patch = (p: Partial<ConceptOptions>) => setOpts((o) => ({ ...o, ...p }))
  const patchOffer = (i: number, v: string) => setOpts((o) => ({ ...o, offers: o.offers.map((x, idx) => (idx === i ? v : x)) as ConceptOptions['offers'] }))

  const save = async () => {
    await onSave(opts)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(conceptHtml(prospect, opts))
      setCopyLabel('Copied!')
    } catch {
      setCopyLabel("Couldn't copy")
    }
    setTimeout(() => setCopyLabel('Copy page HTML'), 1500)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-neutral-900 rounded-xl p-6 shadow-lg grid md:grid-cols-2 gap-6"
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Website concept</h2>
              <p className="text-sm text-neutral-500 mt-1">
                A quick one-page layout for {prospect.name} using their real rating, reviews and contact info. Edit the wording, then show it.
              </p>
            </div>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-xl leading-none" aria-label="Close">
              ×
            </button>
          </div>

          <label className="block text-sm">
            <span className="block mb-1 font-medium">Style</span>
            <select value={opts.style} onChange={(e) => patch({ style: e.target.value })} className="input">
              {Object.entries(CONCEPT_STYLES).map(([key, s]) => (
                <option key={key} value={key}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="block mb-1 font-medium">Tagline</span>
            <input value={opts.tagline} onChange={(e) => patch({ tagline: e.target.value })} className="input" maxLength={90} />
          </label>

          {[0, 1, 2].map((i) => (
            <label key={i} className="block text-sm">
              <span className="block mb-1 font-medium">Offer card {i + 1}</span>
              <input value={opts.offers[i] || ''} onChange={(e) => patchOffer(i, e.target.value)} className="input" maxLength={60} />
            </label>
          ))}

          <label className="block text-sm">
            <span className="block mb-1 font-medium">Hero photo link (optional)</span>
            <input value={opts.img} onChange={(e) => patch({ img: e.target.value })} className="input" placeholder="Paste a link to one of their own photos" maxLength={300} />
            <span className="block mt-1 text-xs text-neutral-500">Use their own photos, or ones you have rights to — ideally from their Instagram, with permission.</span>
          </label>

          <p className="text-xs text-neutral-500">Cards are labelled as sample text on the page itself. Pitchly doesn't invent services or prices — fill them in from what the owner tells you.</p>

          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={copy} className="rounded-md bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2">
              {copyLabel}
            </button>
            <button onClick={save} className="rounded-md border border-neutral-300 dark:border-neutral-700 text-sm font-medium px-4 py-2">
              Save concept
            </button>
            {saved && <span className="text-xs text-brand-600 self-center">Saved</span>}
          </div>

          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <button
              onClick={() => onMarkSent(opts)}
              className="rounded-md border border-neutral-300 dark:border-neutral-700 text-sm font-medium px-4 py-2 w-full sm:w-auto"
            >
              {alreadySent ? 'Concept already marked sent' : 'I sent the concept'}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex gap-1 text-xs">
            <button
              onClick={() => setPhone('desktop')}
              className={`rounded-md px-3 py-1 border ${phone === 'desktop' ? 'bg-brand-600 border-brand-600 text-white' : 'border-neutral-300 dark:border-neutral-700'}`}
            >
              Desktop
            </button>
            <button
              onClick={() => setPhone('phone')}
              className={`rounded-md px-3 py-1 border ${phone === 'phone' ? 'bg-brand-600 border-brand-600 text-white' : 'border-neutral-300 dark:border-neutral-700'}`}
            >
              Phone
            </button>
          </div>
          <div className={`rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-neutral-100 dark:bg-neutral-950 ${phone === 'phone' ? 'flex justify-center p-4' : ''}`}>
            <iframe
              title="Concept preview"
              srcDoc={preview}
              sandbox=""
              className={phone === 'phone' ? 'w-[375px] h-[640px] bg-white rounded-lg shadow' : 'w-full h-[640px] bg-white'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
