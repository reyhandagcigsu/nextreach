import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient.js'

// Cap the fetch so we never pull an unbounded table into the browser. Score
// filtering is derived client-side (not in the DB), so we fetch a bounded
// recent window and filter/paginate over it. See README for the trade-off.
export const FETCH_LIMIT = 500

// Fetches leads for the /admin view, newest first.
export function useLeads() {
  const [leads, setLeads] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [error, setError] = useState(null)
  const [capped, setCapped] = useState(false)

  const fetchLeads = useCallback(async () => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(FETCH_LIMIT)

    if (error) {
      setError(error.message)
      setStatus('error')
    } else {
      setLeads(data ?? [])
      setCapped((data?.length ?? 0) >= FETCH_LIMIT)
      setStatus('ready')
    }
  }, [])

  const reload = useCallback(() => {
    setStatus('loading')
    setError(null)
    return fetchLeads()
  }, [fetchLeads])

  // Optimistically patch a lead (status / owner), then persist. Reverts on error.
  const updateLead = useCallback(
    async (id, patch) => {
      let previous
      setLeads((rows) =>
        rows.map((r) => {
          if (r.id === id) {
            previous = r
            return { ...r, ...patch }
          }
          return r
        })
      )

      const { error } = await supabase.from('leads').update(patch).eq('id', id)
      if (error) {
        // Revert and surface the failure.
        if (previous) setLeads((rows) => rows.map((r) => (r.id === id ? previous : r)))
        setError(`Güncellenemedi: ${error.message}`)
        return false
      }
      return true
    },
    []
  )

  useEffect(() => {
    // Standard fetch-on-mount. The lint rule can't see that fetchLeads only
    // setState()s after its `await`, so it false-positives here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLeads()
  }, [fetchLeads])

  return { leads, status, error, capped, reload, updateLead }
}
