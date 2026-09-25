import { useState } from 'react'
import { OBJECTION_LIST, objectionOf } from '../lib/objections'
import type { OrgSettings, Prospect } from '../lib/types'

export default function ObjectionPicker({
  prospect,
  settings,
  onChange,
}: {
  prospect: Prospect
  settings: OrgSettings
  onChange: (key: string) => void
}) {
  const [copyLabel, setCopyLabel] = useState('Copy reply')
  const active = prospect.objection ? objectionOf(prospect.objection) : undefined

  const copy = async () => {
    if (!active) return
    try {
      await navigator.clipboard.writeText(active.reply(prospect, settings))
      setCopyLabel('Copied!')
    } catch {
      setCopyLabel("Couldn't copy")
    }
    setTimeout(() => setCopyLabel('Copy reply'), 1500)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {OBJECTION_LIST.map((o) => (
          <button
            key={o.key}
            onClick={() => onChange(prospect.objection === o.key ? '' : o.key)}
            className={`text-xs rounded-full px-3 py-1.5 border ${
              prospect.objection === o.key
                ? 'bg-brand-600 border-brand-600 text-white'
                : 'border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {active && (
        <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800/60 p-3 text-sm space-y-2">
          <p>{active.reply(prospect, settings)}</p>
          <button onClick={copy} className="text-xs rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1">
            {copyLabel}
          </button>
        </div>
      )}
    </div>
  )
}
