import { useEffect, useState } from 'react'
import { useOrgSettings } from '../hooks/useOrgSettings'
import { useAuth } from '../context/AuthContext'
import type { PackageDef } from '../lib/types'

export default function Settings() {
  const { isAdmin } = useAuth()
  const { settings, loading, updateSettings } = useOrgSettings()
  const [ownerName, setOwnerName] = useState('')
  const [packages, setPackages] = useState<Record<string, PackageDef>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) {
      setOwnerName(settings.owner_name)
      setPackages(settings.packages)
    }
  }, [settings])

  if (loading || !settings) return <p className="text-sm text-neutral-500">Loading…</p>

  const saveGeneral = async () => {
    await updateSettings({ owner_name: ownerName })
    flash()
  }

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

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wide text-neutral-500">Settings</div>
        <h1 className="text-2xl font-semibold mt-1">Make Pitchly yours</h1>
      </div>

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

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-5">
        <div>
          <h3 className="font-semibold">Packages &amp; pricing</h3>
          <p className="text-sm text-neutral-500">Fill the {'{PKG}'} and {'{PRICE}'} tokens. Prospects are matched to Starter / Business / Premium by opportunity score.</p>
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
            <ul className="text-sm text-neutral-500 list-disc list-inside">
              {pkg.items.map((it, i) => (
                <li key={i}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
