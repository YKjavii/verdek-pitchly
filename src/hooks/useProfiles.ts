import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile, Role } from '../lib/types'

/** Admin-only: list everyone in the org and change roles. RLS + the
 * set_user_role() RPC both reject this for non-admins server-side, so
 * this hook is safe even if someone tampers with the client. */
export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true })
    if (error) setError(error.message)
    else setProfiles((data as Profile[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const setRole = useCallback(
    async (userId: string, role: Role) => {
      const { error } = await supabase.rpc('set_user_role', { target_user: userId, new_role: role })
      if (error) throw error
      await load()
    },
    [load]
  )

  return { profiles, loading, error, reload: load, setRole }
}
