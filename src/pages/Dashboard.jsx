import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useCollection } from '../hooks/useCollection'
import { Card, PageHeader, Badge, Spinner } from '../components/ui'
import { formatDate } from '../lib/format'
import {
  CalendarIcon,
  RocketIcon,
  PencilIcon,
  ListTodoIcon,
} from '../components/icons'

function StatCard({ icon: Icon, label, value, to }) {
  return (
    <Link to={to}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none">{value}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {label}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  )
}

export default function Dashboard() {
  const weeks = useCollection('weekly_summaries', { orderBy: 'created_at' })
  const logs = useCollection('daily_logs', { orderBy: 'log_date' })
  const projects = useCollection('projects', { orderBy: 'created_at' })
  const todos = useCollection('project_todos', {
    orderBy: 'created_at',
    ascending: true,
  })

  const loading =
    weeks.loading || logs.loading || projects.loading || todos.loading

  const activeProjects = projects.rows.filter((p) => p.status !== 'Ferdig')
  const openTodos = todos.rows.filter((t) => !t.is_done)

  const projectsById = useMemo(() => {
    const m = {}
    for (const p of projects.rows) m[p.id] = p
    return m
  }, [projects.rows])

  // Siste aktivitet på tvers av logg og ukesoppsummeringer
  const recent = [
    ...logs.rows.map((r) => ({
      type: 'Daglig logg',
      date: r.created_at,
      text: r.content,
    })),
    ...weeks.rows.map((r) => ({
      type: 'Ukesoppsummering',
      date: r.created_at,
      text: r.week_label,
    })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)

  const lastActivity = recent[0]

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Kort oppsummering av internshipet ditt."
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-7 w-7" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              icon={CalendarIcon}
              label="Uker logget"
              value={weeks.rows.length}
              to="/weeks"
            />
            <StatCard
              icon={RocketIcon}
              label="Aktive prosjekter"
              value={activeProjects.length}
              to="/projects"
            />
            <StatCard
              icon={PencilIcon}
              label="Logg-oppføringer"
              value={logs.rows.length}
              to="/log"
            />
            <StatCard
              icon={ListTodoIcon}
              label="Åpne gjøremål"
              value={openTodos.length}
              to="/todos"
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="mb-1 font-semibold">Siste aktivitet</h2>
              {lastActivity ? (
                <>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {formatDate(lastActivity.date)} · {lastActivity.type}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {recent.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                        <span className="line-clamp-2">
                          <span className="text-slate-400">{r.type}:</span>{' '}
                          {r.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Ingen aktivitet enda. Legg til en logg eller en
                  ukesoppsummering for å komme i gang.
                </p>
              )}
            </Card>

            <Card>
              <h2 className="mb-3 font-semibold">Åpne gjøremål</h2>
              {openTodos.length > 0 ? (
                <ul className="space-y-2">
                  {openTodos.slice(0, 6).map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="line-clamp-1">{t.title}</span>
                      {projectsById[t.project_id] && (
                        <Badge color="slate">
                          {projectsById[t.project_id].title}
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Ingen åpne gjøremål. Fint!
                </p>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
