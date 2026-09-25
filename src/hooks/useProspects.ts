import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Prospect } from '../lib/types'

export function useProspects() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('prospects')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setProspects((data as Prospect[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const channel = supabase
      .channel('prospects-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prospects' }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  const updateProspect = useCallback(async (id: string, patch: Partial<Prospect>, logText?: string) => {
    const { data: userData } = await supabase.auth.getUser()
    const { error } = await supabase.from('prospects').update(patch).eq('id', id)
    if (error) throw error
    if (logText) {
      const prospect = prospects.find((p) => p.id === id)
      if (prospect) {
        await supabase.from('activity_log').insert({
          prospect_id: id,
          org_id: prospect.org_id,
          text: logText,
          created_by: userData.user?.id ?? null,
        })
      }
    }
    await load()
  }, [prospects, load])

  const addProspect = useCallback(
    async (input: Partial<Prospect> & { name: string }) => {
      const { data: userData } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', userData.user?.id).single()
      const { error } = await supabase.from('prospects').insert({
        ...input,
        org_id: profile?.org_id,
        created_by: userData.user?.id ?? null,
      })
      if (error) throw error
      await load()
    },
    [load]
  )

  const deleteProspect = useCallback(async (id: string) => {
    const { error } = await supabase.from('prospects').delete().eq('id', id)
    if (error) throw error
    await load()
  }, [load])

  return { prospects, loading, error, reload: load, updateProspect, addProspect, deleteProspect }
}
