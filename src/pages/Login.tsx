import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { session } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [status, setStatus] = useState<{ kind: 'idle' | 'ok' | 'err'; msg?: string }>({ kind: 'idle' })
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to="/" replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setStatus({ kind: 'idle' })
    try {
      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href } })
        if (error) throw error
        setStatus({ kind: 'ok', msg: 'Check your email for a sign-in link.' })
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setStatus({ kind: 'err', msg: err instanceof Error ? err.message : 'Something went wrong.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-white text-sm font-bold">
            V
          </span>
          <div className="text-lg font-semibold">Verdek · Pitchly</div>
        </div>
        <form onSubmit={submit} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 space-y-4 shadow-sm">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
              placeholder="you@verdek.co"
            />
          </div>
          {mode === 'password' && (
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 disabled:opacity-60"
          >
            {mode === 'magic' ? 'Send sign-in link' : 'Sign in'}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === 'password' ? 'magic' : 'password')}
            className="w-full text-xs text-brand-600 hover:underline"
          >
            {mode === 'password' ? 'Use a magic link instead' : 'Use a password instead'}
          </button>
          {status.kind !== 'idle' && (
            <p className={`text-sm ${status.kind === 'err' ? 'text-red-600' : 'text-brand-700'}`}>{status.msg}</p>
          )}
          <p className="text-xs text-neutral-500 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            Accounts are invite-only. If you don't have one yet, ask your Pitchly administrator to invite you from
            Supabase, or sign in for the first time to bootstrap the workspace.
          </p>
        </form>
      </div>
    </div>
  )
}
