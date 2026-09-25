import { useState } from 'react'
import type { OrgSettings, Prospect } from '../lib/types'
import { recommendPackageKey } from '../lib/pitch'

export default function WonDialog({
  prospect,
  settings,
  onSubmit,
  onClose,
}: {
  prospect: Prospect
  settings: OrgSettings
  onSubmit: (pkgKey: string, value: number) => void | Promise<void>
  onClose: () => void
}) {
  const [pkgKey, setPkgKey] = useState(prospect.package || recommendPackageKey(prospect))
  const [value, setValue] = useState(() => {
    const n = Number(prospect.won_value || String(settings.packages[pkgKey]?.price || '').replace(/[^\d.]/g, ''))
    return Number.isFinite(n) && n > 0 ? String(n) : ''
  })
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const n = Number(value.replace(/[^\d.]/g, ''))
    setBusy(true)
    try {
      await onSubmit(pkgKey, Number.isFinite(n) ? n : 0)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-xl p-6 space-y-4 shadow-lg">
        <div>
          <h2 className="text-lg font-semibold">Nice, {prospect.name} is a client</h2>
          <p className="text-sm text-neutral-500 mt-1">Record the deal so the Funnel page shows real revenue.</p>
        </div>
        <label className="block text-sm">
          <span className="block mb-1 font-medium">Package</span>
          <select value={pkgKey} onChange={(e) => setPkgKey(e.target.value)} className="input">
            {Object.entries(settings.packages).map(([key, pkg]) => (
              <option key={key} value={key}>
                {pkg.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="block mb-1 font-medium">Deal value (JMD, numbers only)</span>
          <input value={value} onChange={(e) => setValue(e.target.value)} className="input" placeholder="60000" inputMode="numeric" />
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm">
            Cancel
          </button>
          <button disabled={busy} className="rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2">
            Mark won
          </button>
        </div>
      </form>
    </div>
  )
}
