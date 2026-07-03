import { useState } from 'react'
import { useCurrentInternship } from '../context/InternshipContext'
import { useAuth } from '../context/AuthContext'
import { Button, Card, Field, Input } from './ui'

export default function InternshipOnboard() {
  const { create } = useCurrentInternship()
  const { signOut } = useAuth()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      await create(name.trim())
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <img src="/icon.svg" alt="" className="mx-auto mb-3 h-14 w-14 rounded-xl" />
          <h1 className="text-2xl font-bold">Velkommen!</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Opprett ditt forste internship for a komme i gang. Du kan legge til
            flere senere.
          </p>
        </div>
        <Card>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Navn pa internshipet">
              <Input
                required
                autoFocus
                placeholder="f.eks. Sommerjobb hos Bliksund 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? 'Oppretter ...' : 'Opprett internship'}
            </Button>
          </form>
        </Card>
        <button
          onClick={signOut}
          className="mt-4 w-full text-center text-xs text-slate-400 hover:underline"
        >
          Logg ut
        </button>
      </div>
    </div>
  )
}
