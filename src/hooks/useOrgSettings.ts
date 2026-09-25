import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { OrgSettings } from '../lib/types'
import { useAuth } from '../context/AuthContext'

export function useOrgSettings() {
  const { profile } = useAuth()
  const [settings, setSettings] = useState<OrgSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    const { data } = await supabase.from('org_settings').select('*').eq('org_id', profile.org_id).maybeSingle()
    setSettings((data as OrgSettings) ?? null)
    setLoading(false)
  }, [profile])

  useEffect(() => {
    load()
  }, [load])

  const updateSettings = useCallback(
    async (patch: Partial<OrgSettings>) => {
      if (!profile) return
      const { error } = await supabase.from('org_settings').update(patch).eq('org_id', profile.org_id)
      if (error) throw error
      await load()
    },
    [profile, load]
  )

  return { settings, loading, updateSettings, reload: load }
}
