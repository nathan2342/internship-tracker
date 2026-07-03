import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button, Card, Field, Input } from './ui'

export default function Login() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [message, setMessage] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setStatus('sending')
    setMessage('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) {
      setStatus('error')
      setMessage(error.message)
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/icon.svg" alt="" className="mb-3 h-14 w-14 rounded-xl" />
          <h1 className="text-2xl font-bold">Internship Tracker</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Logg inn for å se og synkronisere internship-loggen din.
          </p>
        </div>

        <Card>
          {status === 'sent' ? (
            <div className="py-4 text-center">
              <p className="font-medium">Sjekk e-posten din ✉️</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Vi har sendt en innloggingslenke til{' '}
                <span className="font-medium">{email}</span>. Åpne lenken på
                denne enheten for å logge inn.
              </p>
              <Button
                variant="ghost"
                className="mt-4"
                onClick={() => setStatus('idle')}
              >
                Bruk en annen e-post
              </Button>
            </div>
          ) : (
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
              {status === 'error' && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {message}
                </p>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={status === 'sending'}
              >
                {status === 'sending'
                  ? 'Sender ...'
                  : 'Send innloggingslenke'}
              </Button>
              <p className="text-center text-xs text-slate-400">
                Du får en lenke på e-post. Ingen passord nødvendig.
              </p>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
