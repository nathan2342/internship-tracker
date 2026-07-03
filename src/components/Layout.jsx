import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Button } from './ui'
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
} from './icons'

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
          <Button variant="secondary" className="w-full" onClick={signOut}>
            <LogoutIcon className="h-4 w-4" /> Logg ut
          </Button>
        </div>
      </aside>

      {/* Topbar (mobile) */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-slate-200 bg-white/90 px-3 py-2 backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-900/90">
        <InternshipMenu compact />
        <div className="flex items-center gap-1">
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
