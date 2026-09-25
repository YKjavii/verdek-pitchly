import { useState } from 'react'
import { useProspects } from '../hooks/useProspects'
import type { WebsiteType } from '../lib/types'

export default function AddProspectDialog({ onClose }: { onClose: () => void }) {
  const { addProspect } = useProspects()
  const [name, setName] = useState('')
  const [area, setArea] = useState('')
  const [phone, setPhone] = useState('')
  const [rating, setRating] = useState('')
  const [reviews, setReviews] = useState('')
  const [websiteType, setWebsiteType] = useState<WebsiteType>('none')
  const [instagram, setInstagram] = useState('')
  const [category, setCategory] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const r = parseFloat(rating)
    const v = parseInt(reviews, 10)
    if (!name.trim()) return setErr('Enter the business name.')
    if (!(r >= 1 && r <= 5)) return setErr('Rating should be a number from 1 to 5.')
    if (!(v >= 0)) return setErr('Enter the number of reviews.')
    setBusy(true)
    try {
      await addProspect({
        name: name.trim(),
        area: area.trim() || 'Jamaica',
        phone: phone.trim(),
        rating: r,
        reviews: v,
        category: category.trim() || 'Business',
        website_type: websiteType,
        website_note: 'Added manually. Verify the website before pitching.',
        instagram: instagram.trim().replace(/^@/, ''),
        source: 'manual',
      })
      onClose()
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Could not add prospect.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-xl p-6 space-y-3 shadow-lg"
      >
        <h2 className="text-lg font-semibold">Add a prospect</h2>
        <p className="text-sm text-neutral-500">A business you found yourself. Verify the facts before pitching.</p>
        <Field label="Business name">
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Area">
            <input value={area} onChange={(e) => setArea(e.target.value)} className="input" placeholder="e.g. Negril" />
          </Field>
          <Field label="Phone">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="(876) 555-0100" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Google rating">
            <input value={rating} onChange={(e) => setRating(e.target.value)} className="input" placeholder="4.8" inputMode="decimal" />
          </Field>
          <Field label="Number of reviews">
            <input value={reviews} onChange={(e) => setReviews(e.target.value)} className="input" placeholder="42" inputMode="numeric" />
          </Field>
        </div>
        <Field label="Category">
          <input value={category} onChange={(e) => setCategory(e.target.value)} className="input" placeholder="e.g. Barbershop" />
        </Field>
        <Field label="Web presence">
          <select value={websiteType} onChange={(e) => setWebsiteType(e.target.value as WebsiteType)} className="input">
            <option value="none">No website</option>
            <option value="weak">Weak website (site-builder / booking-platform)</option>
            <option value="listing">Website OK, listing issue</option>
          </select>
        </Field>
        <Field label="Instagram handle (optional)">
          <input value={instagram} onChange={(e) => setInstagram(e.target.value)} className="input" placeholder="handle without @" />
        </Field>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm">
            Cancel
          </button>
          <button disabled={busy} className="rounded-md bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2">
            Add prospect
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="block mb-1 font-medium">{label}</span>
      {children}
    </label>
  )
}
