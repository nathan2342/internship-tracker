import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCollection } from '../hooks/useCollection'
import {
  Button,
  Card,
  Field,
  Input,
  Textarea,
  Select,
  Modal,
  Badge,
  EmptyState,
  PageHeader,
  Spinner,
} from '../components/ui'
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  CalendarIcon,
} from '../components/icons'
import { STATUS_COLOR } from './Projects'
import { formatDate, todayISO } from '../lib/format'

const emptyWeek = {
  week_label: '',
  week_date: todayISO(),
  highlights: '',
  challenges: '',
}

export default function Weeks() {
  const weeks = useCollection('weekly_summaries')
  const entries = useCollection('week_entries', {
    orderBy: 'created_at',
    ascending: true,
  })
  const projects = useCollection('projects')

  const [weekModal, setWeekModal] = useState({ open: false, editing: null })
  const [weekForm, setWeekForm] = useState(emptyWeek)
  const [entryModal, setEntryModal] = useState({ open: false, weekId: null })
  const [entryForm, setEntryForm] = useState({ project_id: '', description: '' })
  const [saving, setSaving] = useState(false)

  const projectsById = useMemo(() => {
    const m = {}
    for (const p of projects.rows) m[p.id] = p
    return m
  }, [projects.rows])

  const entriesByWeek = useMemo(() => {
    const m = {}
    for (const e of entries.rows) {
      ;(m[e.week_id] ??= []).push(e)
    }
    return m
  }, [entries.rows])

  const loading = weeks.loading || entries.loading || projects.loading

  // --- Uke (week) ---
  const openNewWeek = () => {
    setWeekModal({ open: true, editing: null })
    setWeekForm(emptyWeek)
  }
  const openEditWeek = (w) => {
    setWeekModal({ open: true, editing: w })
    setWeekForm({
      week_label: w.week_label ?? '',
      week_date: w.week_date ?? todayISO(),
      highlights: w.highlights ?? '',
      challenges: w.challenges ?? '',
    })
  }
  const saveWeek = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (weekModal.editing) await weeks.update(weekModal.editing.id, weekForm)
      else await weeks.insert(weekForm)
      setWeekModal({ open: false, editing: null })
    } finally {
      setSaving(false)
    }
  }
  const deleteWeek = async (w) => {
    if (confirm(`Slette "${w.week_label}" og alt arbeid i den uka?`))
      await weeks.remove(w.id)
  }

  // --- Arbeidsoppforing (entry) ---
  const openEntry = (weekId) => {
    setEntryModal({ open: true, weekId })
    setEntryForm({ project_id: '', description: '' })
  }
  const saveEntry = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await entries.insert({
        week_id: entryModal.weekId,
        project_id: entryForm.project_id || null,
        description: entryForm.description,
      })
      setEntryModal({ open: false, weekId: null })
    } finally {
      setSaving(false)
    }
  }
  const deleteEntry = async (id) => {
    await entries.remove(id)
  }

  const setW = (k) => (e) => setWeekForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div>
      <PageHeader
        title="Uker"
        description="Oversikt over uker. Trykk + for a legge til arbeid pa et prosjekt."
        action={
          <Button onClick={openNewWeek}>
            <PlusIcon className="h-4 w-4" /> Ny uke
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-7 w-7" />
        </div>
      ) : weeks.rows.length === 0 ? (
        <EmptyState
          icon={CalendarIcon}
          title="Ingen uker enda"
          description="Trykk «Ny uke» for a legge til den forste."
        />
      ) : (
        <div className="space-y-3">
          {weeks.rows.map((w) => {
            const list = entriesByWeek[w.id] ?? []
            return (
              <Card key={w.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{w.week_label}</h3>
                    {w.week_date && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(w.week_date)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditWeek(w)}
                      aria-label="Rediger uke"
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteWeek(w)}
                      aria-label="Slett uke"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {(w.highlights || w.challenges) && (
                  <dl className="mt-3 space-y-2 text-sm">
                    {w.highlights && (
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Høydepunkter
                        </dt>
                        <dd className="whitespace-pre-wrap text-slate-700 dark:text-slate-200">
                          {w.highlights}
                        </dd>
                      </div>
                    )}
                    {w.challenges && (
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Utfordringer
                        </dt>
                        <dd className="whitespace-pre-wrap text-slate-700 dark:text-slate-200">
                          {w.challenges}
                        </dd>
                      </div>
                    )}
                  </dl>
                )}

                <div className="mt-3 space-y-2">
                  {list.map((en) => {
                    const p = en.project_id ? projectsById[en.project_id] : null
                    return (
                      <div
                        key={en.id}
                        className="flex items-start gap-2 rounded-lg bg-slate-50 p-2 text-sm dark:bg-slate-800/50"
                      >
                        <div className="flex-1">
                          {p ? (
                            <Badge color={STATUS_COLOR[p.status] ?? 'indigo'}>
                              {p.title}
                            </Badge>
                          ) : (
                            <Badge color="slate">Generelt</Badge>
                          )}
                          <p className="mt-1 whitespace-pre-wrap text-slate-700 dark:text-slate-200">
                            {en.description}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteEntry(en.id)}
                          aria-label="Slett arbeid"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  onClick={() => openEntry(w.id)}
                >
                  <PlusIcon className="h-4 w-4" /> Legg til arbeid
                </Button>
              </Card>
            )
          })}
        </div>
      )}

      {/* Uke-modal */}
      <Modal
        open={weekModal.open}
        onClose={() => setWeekModal({ open: false, editing: null })}
        title={weekModal.editing ? 'Rediger uke' : 'Ny uke'}
      >
        <form onSubmit={saveWeek} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ukenummer / tittel">
              <Input
                required
                placeholder="Uke 23"
                value={weekForm.week_label}
                onChange={setW('week_label')}
              />
            </Field>
            <Field label="Dato">
              <Input
                type="date"
                value={weekForm.week_date}
                onChange={setW('week_date')}
              />
            </Field>
          </div>
          <Field label="Høydepunkter">
            <Textarea value={weekForm.highlights} onChange={setW('highlights')} />
          </Field>
          <Field label="Utfordringer">
            <Textarea value={weekForm.challenges} onChange={setW('challenges')} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setWeekModal({ open: false, editing: null })}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Lagrer ...' : 'Lagre'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Arbeids-modal */}
      <Modal
        open={entryModal.open}
        onClose={() => setEntryModal({ open: false, weekId: null })}
        title="Legg til arbeid"
      >
        {projects.rows.length === 0 ? (
          <div className="py-2 text-sm text-slate-500 dark:text-slate-400">
            Du har ingen prosjekter enda. Lag et under{' '}
            <Link to="/projects" className="text-indigo-600 underline">
              Prosjekter
            </Link>
            , eller legg til generelt arbeid under.
          </div>
        ) : null}
        <form onSubmit={saveEntry} className="space-y-4">
          <Field label="Prosjekt">
            <Select
              value={entryForm.project_id}
              onChange={(e) =>
                setEntryForm((f) => ({ ...f, project_id: e.target.value }))
              }
            >
              <option value="">Generelt / annet</option>
              {projects.rows.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Hva gjorde du?">
            <Textarea
              required
              rows={4}
              value={entryForm.description}
              onChange={(e) =>
                setEntryForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEntryModal({ open: false, weekId: null })}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Lagrer ...' : 'Lagre'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
