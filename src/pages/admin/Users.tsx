import { useState } from 'react'
import { useProfiles } from '../../hooks/useProfiles'
import { useAuth } from '../../context/AuthContext'
import type { Role } from '../../lib/types'

export default function AdminUsers() {
  const { profile: me } = useAuth()
  const { profiles, loading, error, setRole } = useProfiles()
  const [busyId, setBusyId] = useState<string | null>(null)

  const toggle = async (userId: string, current: Role) => {
    setBusyId(userId)
    try {
      await setRole(userId, current === 'admin' ? 'member' : 'admin')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wide text-neutral-500">Admin</div>
        <h1 className="text-2xl font-semibold mt-1">Everyone in this workspace</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Invite new people from your Supabase project (Authentication → Users → Invite user). They'll appear here
          automatically as a member the first time they sign in.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-neutral-500">Loading…</p>}

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden">
        {profiles.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <div className="font-medium">{p.display_name || p.email}</div>
              <div className="text-xs text-neutral-500">{p.email}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs rounded-full px-2 py-0.5 ${p.role === 'admin' ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'}`}>
                {p.role === 'admin' ? 'Administrator' : 'Member'}
              </span>
              <button
                onClick={() => toggle(p.id, p.role)}
                disabled={busyId === p.id || p.id === me?.id}
                className="text-xs rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1 disabled:opacity-40"
                title={p.id === me?.id ? "You can't change your own role here" : undefined}
              >
                {p.role === 'admin' ? 'Make member' : 'Make admin'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
