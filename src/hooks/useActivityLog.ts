import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ActivityLogEntry } from '../lib/types'

export function useActivityLog(prospectId: string | null) {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!prospectId) {
      setEntries([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('activity_log')
      .select('*')
      .eq('prospect_id', prospectId)
      .order('created_at', { ascending: false })
    setEntries((data as ActivityLogEntry[]) ?? [])
    setLoading(false)
  }, [prospectId])

  useEffect(() => {
    load()
  }, [load])

  return { entries, loading, reload: load }
}
