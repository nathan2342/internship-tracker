import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useCurrentInternship } from '../context/InternshipContext'

/**
 * Generisk CRUD mot en Supabase-tabell, avgrenset til det valgte internshipet.
 * RLS sorger for at man kun ser sine egne rader. user_id settes automatisk i
 * databasen (default auth.uid()), og internship_id settes her ved insert.
 */
export function useCollection(
  table,
  { orderBy = 'created_at', ascending = false } = {},
) {
  const { user } = useAuth()
  const { currentId } = useCurrentInternship()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!user || !currentId) {
      setRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('internship_id', currentId)
      .order(orderBy, { ascending })
    if (error) setError(error.message)
    else setRows(data ?? [])
    setLoading(false)
  }, [table, orderBy, ascending, user, currentId])

  useEffect(() => {
    load()
  }, [load])

  const insert = async (values) => {
    const { data, error } = await supabase
      .from(table)
      .insert({ ...values, internship_id: currentId })
      .select()
      .single()
    if (error) {
      setError(error.message)
      throw error
    }
    setRows((prev) => sortRows([data, ...prev], orderBy, ascending))
    return data
  }

  const update = async (id, values) => {
    const { data, error } = await supabase
      .from(table)
      .update(values)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      setError(error.message)
      throw error
    }
    setRows((prev) =>
      sortRows(
        prev.map((r) => (r.id === id ? data : r)),
        orderBy,
        ascending,
      ),
    )
    return data
  }

  const remove = async (id) => {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) {
      setError(error.message)
      throw error
    }
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  return { rows, loading, error, reload: load, insert, update, remove }
}

function sortRows(rows, orderBy, ascending) {
  return [...rows].sort((a, b) => {
    const av = a[orderBy]
    const bv = b[orderBy]
    if (av === bv) return 0
    if (av == null) return 1
    if (bv == null) return -1
    const cmp = av > bv ? 1 : -1
    return ascending ? cmp : -cmp
  })
}
