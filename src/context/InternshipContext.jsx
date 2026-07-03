import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const InternshipContext = createContext(null)

export function InternshipProvider({ children }) {
  const { user } = useAuth()
  const [internships, setInternships] = useState([])
  const [currentId, setCurrentId] = useState(() =>
    localStorage.getItem('currentInternshipId'),
  )
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) {
      setInternships([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('internships')
      .select('*')
      .order('created_at', { ascending: true })
    if (!error) setInternships(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  // Sorg for at currentId alltid peker pa et eksisterende internship.
  useEffect(() => {
    if (loading) return
    if (internships.length === 0) {
      if (currentId !== null) setCurrentId(null)
      return
    }
    const exists = internships.some((i) => i.id === currentId)
    if (!exists) setCurrentId(internships[0].id)
  }, [internships, loading, currentId])

  useEffect(() => {
    if (currentId) localStorage.setItem('currentInternshipId', currentId)
  }, [currentId])

  const create = async (name, description) => {
    const { data, error } = await supabase
      .from('internships')
      .insert({ name, description })
      .select()
      .single()
    if (error) throw error
    setInternships((prev) => [...prev, data])
    setCurrentId(data.id)
    return data
  }

  const rename = async (id, name) => {
    const { data, error } = await supabase
      .from('internships')
      .update({ name })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setInternships((prev) => prev.map((i) => (i.id === id ? data : i)))
  }

  const remove = async (id) => {
    const { error } = await supabase.from('internships').delete().eq('id', id)
    if (error) throw error
    setInternships((prev) => prev.filter((i) => i.id !== id))
  }

  const value = {
    internships,
    currentId,
    current: internships.find((i) => i.id === currentId) ?? null,
    loading,
    setCurrentId,
    create,
    rename,
    remove,
    reload: load,
  }

  return (
    <InternshipContext.Provider value={value}>
      {children}
    </InternshipContext.Provider>
  )
}

export function useCurrentInternship() {
  return useContext(InternshipContext)
}
