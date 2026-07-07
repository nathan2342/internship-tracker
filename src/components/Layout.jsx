import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Button, Modal, Field, Input } from './ui'
import InternshipMenu from './InternshipMenu'
import {
  HomeIcon,
  CalendarIcon,
  BulbIcon,
  PencilIcon,
  RocketIcon,
  ListTodoIcon,
  NoteIcon,
  SunIcon,
  MoonIcon,
  LogoutIcon,
  KeyIcon,
} from './icons'

function PasswordButton({ compact = false }) {
  const [open, setOpen] = useState(false)
  const [pw, setPw] = useState('')
  const [status, setStatus] = useState('idle') // idle | busy | ok | error
  const [message, setMessage] = useState('')

  const save = async (e) => {
    e.preventDefault()
    setStatus('busy')
    setMessage('')
    const { error } = await supabase.auth.updateUser({ password: pw })
    if (error) {
      setStatus('error')
      setMessage(error.message)
    } else {
      setStatus('ok')
      setMessage('Passord lagret. Du kan nå logge inn med det overalt.')
      setPw('')
    }
  }

  return (
    <>
      {compact ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label="Sett passord"
        >
          <KeyIcon className="h-5 w-5" />
        </Button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="mb-2 flex w-full items-center gap-2 rounded-lg px-1 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <KeyIcon className="h-4 w-4" /> Sett / endre passord
        </button>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Sett passord">
        <form onSubmit={save} className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sett et passord på kontoen din, så kan du logge inn med e-post og
            passord på alle enheter (også i den installerte appen).
          </p>
          <Field label="Nytt passord">
            <Input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Minst 6 tegn"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
          </Field>
          {status === 'error' && (
            <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
          )}
          {status === 'ok' && (
            <p className="text-sm text-green-600 dark:text-green-400">
              {message}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Lukk
            </Button>
            <Button type="submit" disabled={status === 'busy'}>
              {status === 'busy' ? 'Lagrer ...' : 'Lagre passord'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

const NAV = [
  { to: '/', label: 'Dashboard', short: 'Hjem', icon: HomeIcon, end: true },
  { to: '/weeks', label: 'Uker', short: 'Uker', icon: CalendarIcon },
  { to: '/projects', label: 'Prosjekter', short: 'Prosjekt', icon: RocketIcon },
  { to: '/todos', label: 'Gjøremål', short: 'Gjøre', icon: ListTodoIcon },
  { to: '/board', label: 'Tavle', short: 'Tavle', icon: NoteIcon },
  { to: '/learnings', label: 'Ting jeg har lært', short: 'Lært', icon: BulbIcon },
  { to: '/log', label: 'Daglig logg', short: 'Logg', icon: PencilIcon },
]

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Bytt tema">
      {theme === 'dark' ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </Button>
  )
}

export default function Layout({ children }) {
  const { user, signOut } = useAuth()
  const { pathname } = useLocation()
  const fullBleed = pathname === '/board'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white p-4 md:flex dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2 px-2">
          <img src="/icon.svg" alt="" className="h-8 w-8 rounded-lg" />
          <span className="font-bold">Internship Tracker</span>
        </div>
        <div className="mb-4">
          <InternshipMenu />
        </div>
        <nav className="flex-1 space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {user?.email}
            </p>
            <ThemeToggle />
          </div>
          <PasswordButton />
          <Button variant="secondary" className="w-full" onClick={signOut}>
            <LogoutIcon className="h-4 w-4" /> Logg ut
          </Button>
        </div>
      </aside>

      {/* Topbar (mobile) */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-slate-200 bg-white/90 px-3 py-2 backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-900/90">
        <InternshipMenu compact />
        <div className="flex items-center gap-1">
          <PasswordButton compact />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            aria-label="Logg ut"
          >
            <LogoutIcon className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main
        className={
          fullBleed
            ? 'pb-20 md:ml-64 md:pb-0'
            : 'px-4 pb-24 pt-6 md:ml-64 md:px-8 md:pb-10'
        }
      >
        {fullBleed ? children : <div className="mx-auto max-w-3xl">{children}</div>}
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-7 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-900/95">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.short}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
