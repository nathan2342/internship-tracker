import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button, Card, Field, Input } from './ui'

export default function Login() {
  const [mode, setMode] = useState('signin') // signin | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('idle') // idle | busy | error | info
  const [message, setMessage] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setStatus('busy')
    setMessage('')
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setStatus('error')
        setMessage('Feil e-post eller passord.')
      }
      // Ved suksess oppdager AuthContext sesjonen automatisk.
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setStatus('error')
        setMessage(error.message)
      } else if (!data.session) {
        setStatus('info')
        setMessage(
          'Konto opprettet. Blir du bedt om å bekrefte e-post, gjør det og logg inn.',
        )
      }
      // Ellers logges du inn automatisk.
    }
  }

  const switchMode = () => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
    setStatus('idle')
    setMessage('')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/icon.svg" alt="" className="mb-3 h-14 w-14 rounded-xl" />
          <h1 className="text-2xl font-bold">Internship Tracker</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {mode === 'signin'
              ? 'Logg inn for å se internship-loggen din.'
              : 'Opprett en konto for å komme i gang.'}
          </p>
        </div>

        <Card>
          <form onSubmit={submit} className="space-y-4">
            <Field label="E-postadresse">
              <Input
                type="email"
                required
                autoComplete="email"
                placeholder="navn@eksempel.no"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Passord">
              <Input
                type="password"
                required
                minLength={6}
                autoComplete={
                  mode === 'signin' ? 'current-password' : 'new-password'
                }
                placeholder="Minst 6 tegn"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>

            {status === 'error' && (
              <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
            )}
            {status === 'info' && (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {message}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={status === 'busy'}>
              {status === 'busy'
                ? 'Vent ...'
                : mode === 'signin'
                  ? 'Logg inn'
                  : 'Opprett konto'}
            </Button>
          </form>

          <button
            type="button"
            onClick={switchMode}
            className="mt-4 w-full text-center text-sm text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {mode === 'signin'
              ? 'Har du ikke konto? Registrer deg'
              : 'Har du konto? Logg inn'}
          </button>
        </Card>
      </div>
    </div>
  )
}
