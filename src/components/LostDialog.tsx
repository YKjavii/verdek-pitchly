import { useState } from 'react'
import { LOSS, type LossKey } from '../lib/loss'

export default function LostDialog({
  name,
  initialReason,
  initialNote,
  onSubmit,
  onClose,
}: {
  name: string
  initialReason?: string
  initialNote?: string
  onSubmit: (reason: LossKey, note: string) => void | Promise<void>
  onClose: () => void
}) {
  const [reason, setReason] = useState<LossKey | ''>((initialReason as LossKey) || '')
  const [note, setNote] = useState(initialNote || '')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason) return
    setBusy(true)
    try {
      await onSubmit(reason, note.trim())
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-xl p-6 space-y-4 shadow-lg">
        <div>
          <h2 className="text-lg font-semibold">Why didn't {name} buy?</h2>
          <p className="text-sm text-neutral-500 mt-1">Pick the closest reason. The Funnel page uses these to show what to change.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {LOSS.map(([key, label]) => (
            <button
              type="button"
              key={key}
              onClick={() => setReason(key)}
              className={`text-xs rounded-full px-3 py-1.5 border ${
                reason === key
                  ? 'bg-brand-600 border-brand-600 text-white'
                  : 'border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="block text-sm">
          <span className="block mb-1 font-medium">Note (optional)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} className="input" maxLength={120} />
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm">
            Cancel
          </button>
          <button disabled={!reason || busy} className="rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2">
            Mark lost
          </button>
        </div>
      </form>
    </div>
  )
}
