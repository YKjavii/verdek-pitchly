import { QUAL_LIST, qualAdvice, type QualKey } from '../lib/qualification'

export default function QualificationPicker({ value, onChange }: { value: string; onChange: (key: QualKey) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {QUAL_LIST.map((q) => (
          <button
            key={q.key}
            onClick={() => onChange(q.key)}
            className={`text-xs rounded-full px-3 py-1.5 border font-semibold ${
              value === q.key
                ? `border-current bg-neutral-100 dark:bg-neutral-800 ${q.tone}`
                : 'border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium'
            }`}
          >
            {q.label}
          </button>
        ))}
      </div>
      {value && <p className="text-xs text-neutral-500">{qualAdvice(value)}</p>}
    </div>
  )
}
