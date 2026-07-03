import { useMemo, useState } from 'react'
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
import { PlusIcon, EditIcon, TrashIcon, RocketIcon } from '../components/icons'
import TodoTree from '../components/TodoTree'
import { computeReorder } from '../lib/todos'

export const STATUSES = ['Idé', 'Ikke begynt', 'Pågår', 'Ferdig']
export const STATUS_COLOR = {
  Idé: 'slate',
  'Ikke begynt': 'blue',
  Pågår: 'amber',
  Ferdig: 'green',
}
const SCOPES = ['Liten', 'Middels', 'Stor']

const empty = {
  title: '',
  description: '',
  status: 'Idé',
  scope: 'Middels',
  skillsText: '',
}

function skillsToText(arr) {
  return Array.isArray(arr) ? arr.join(', ') : ''
}
function textToSkills(text) {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export default function Projects() {
  const { rows, loading, insert, update, remove } = useCollection('projects')
  const todos = useCollection('project_todos', {
    orderBy: 'created_at',
    ascending: true,
  })

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState('Alle')
  const [search, setSearch] = useState('')

  const todosByProject = useMemo(() => {
    const m = {}
    for (const t of todos.rows) (m[t.project_id] ??= []).push(t)
    return m
  }, [todos.rows])

  const openNew = () => {
    setEditing(null)
    setForm(empty)
    setOpen(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({
      title: row.title ?? '',
      description: row.description ?? '',
      status: row.status ?? 'Idé',
      scope: row.scope ?? 'Middels',
      skillsText: skillsToText(row.skills),
    })
    setOpen(true)
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    const values = {
      title: form.title,
      description: form.description,
      status: form.status,
      scope: form.scope,
      skills: textToSkills(form.skillsText),
    }
    try {
      if (editing) await update(editing.id, values)
      else await insert(values)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (row) => {
    if (confirm(`Slette "${row.title}"?`)) await remove(row.id)
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const quickStatus = (row, status) => update(row.id, { status })

  const addTodo = (projectId, title, parentId) =>
    todos.insert({
      project_id: projectId,
      title,
      is_done: false,
      parent_id: parentId ?? null,
    })
  const toggleTodo = (t) => todos.update(t.id, { is_done: !t.is_done })
  const saveTodoEdit = (id, title) => todos.update(id, { title })
  const deleteTodo = async (t) => {
    const hadChildren = todos.rows.some((x) => x.parent_id === t.id)
    await todos.remove(t.id)
    if (hadChildren) await todos.reload()
  }
  const moveTodo = async (dragId, newParentId, beforeId) => {
    const updates = computeReorder(todos.rows, dragId, newParentId, beforeId)
    for (const u of updates)
      await todos.update(u.id, { parent_id: u.parent_id, position: u.position })
  }

  const q = search.trim().toLowerCase()
  const visible = rows.filter((r) => {
    const okStatus = statusFilter === 'Alle' || r.status === statusFilter
    const okSearch =
      !q ||
      r.title?.toLowerCase().includes(q) ||
      (r.skills ?? []).some((s) => s.toLowerCase().includes(q))
    return okStatus && okSearch
  })

  return (
    <div>
      <PageHeader
        title="Prosjekter"
        description="Fra idé til ferdig. Status, omfang, beskrivelse, skills og gjøremål."
        action={
          <Button onClick={openNew}>
            <PlusIcon className="h-4 w-4" /> Nytt prosjekt
          </Button>
        }
      />

      <div className="mb-3 flex flex-wrap gap-2">
        {['Alle', ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <Input
        className="mb-4"
        placeholder="Sok etter tittel eller skill ..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-7 w-7" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={RocketIcon}
          title="Ingen prosjekter her"
          description="Legg til et prosjekt eller en idé."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visible.map((row) => (
            <Card key={row.id} className="group">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{row.title}</h3>
                <div className="flex shrink-0 gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(row)}
                    aria-label="Rediger"
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(row)}
                    aria-label="Slett"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {row.description && (
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
                  {row.description}
                </p>
              )}

              {row.skills?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {row.skills.map((s) => (
                    <Badge key={s} color="indigo">
                      {s}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge color={STATUS_COLOR[row.status] ?? 'slate'}>
                  {row.status}
                </Badge>
                {row.scope && <Badge color="slate">Omfang: {row.scope}</Badge>}
                <Select
                  className="ml-auto max-w-[9rem] py-1 text-xs"
                  value={row.status}
                  onChange={(e) => quickStatus(row, e.target.value)}
                  aria-label="Endre status"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>

              {(() => {
                const list = todosByProject[row.id] ?? []
                const done = list.filter((t) => t.is_done).length
                return (
                  <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-800">
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                      Gjøremål {list.length > 0 && `(${done}/${list.length})`}
                    </p>
                    <TodoTree
                      todos={list}
                      onAdd={(title, parentId) =>
                        addTodo(row.id, title, parentId)
                      }
                      onToggle={toggleTodo}
                      onSaveEdit={saveTodoEdit}
                      onDelete={deleteTodo}
                      onMove={moveTodo}
                    />
                  </div>
                )
              })()}
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Rediger prosjekt' : 'Nytt prosjekt'}
      >
        <form onSubmit={save} className="space-y-4">
          <Field label="Tittel">
            <Input required value={form.title} onChange={set('title')} />
          </Field>
          <Field label="Beskrivelse">
            <Textarea value={form.description} onChange={set('description')} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <Select value={form.status} onChange={set('status')}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Omfang">
              <Select value={form.scope} onChange={set('scope')}>
                {SCOPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Skills (skill dem med komma)">
            <Input
              placeholder="React, SQL, kommunikasjon"
              value={form.skillsText}
              onChange={set('skillsText')}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
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
