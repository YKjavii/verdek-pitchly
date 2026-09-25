import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Sweep } from '../lib/types'

export function useSweeps() {
  const [sweeps, setSweeps] = useState<Sweep[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('sweeps').select('*').order('requested_at', { ascending: false })
    setSweeps((data as Sweep[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const channel = supabase
      .channel('sweeps-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sweeps' }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  const requestSweep = useCallback(
    async (query: string, area: string) => {
      const { data: userData } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', userData.user?.id).single()
      const { error } = await supabase.from('sweeps').insert({
        query,
        area: area || 'anywhere in Jamaica',
        org_id: profile?.org_id,
        requested_by: userData.user?.id ?? null,
      })
      if (error) throw error
      await load()
    },
    [load]
  )

  const markStatus = useCallback(
    async (id: string, status: Sweep['status'], count?: number) => {
      const patch: Partial<Sweep> = { status }
      if (count !== undefined) patch.count = count
      if (status === 'done') patch.completed_at = new Date().toISOString()
      const { error } = await supabase.from('sweeps').update(patch).eq('id', id)
      if (error) throw error
      await load()
    },
    [load]
  )

  return { sweeps, loading, reload: load, requestSweep, markStatus }
}

/** The copy-pasteable instruction to hand to Claude (or a VA) to actually run a sweep. */
export function sweepInstructions(sweep: Pick<Sweep, 'id' | 'query' | 'area'>): string {
  const areaTxt = sweep.area === 'anywhere in Jamaica' || sweep.area === 'all' ? 'in Jamaica' : `in ${sweep.area}`
  return `Run my pending Pitchly sweep (${sweep.id}): find "${sweep.query}" businesses ${areaTxt} on Google Maps that have strong reviews and a weak or missing website. Check reviews and websites, then add the qualified prospects to Pitchly. Skip businesses already in Pitchly, favour established operators (roughly 100+ reviews) that can afford the services, and record the website link, phone and any Instagram or Facebook page you find.`
}
