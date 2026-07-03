import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCollection } from '../hooks/useCollection'
import {
  Card,
  Badge,
  Button,
  Input,
  Select,
  EmptyState,
  PageHeader,
  Spinner,
} from '../components/ui'
import { ListTodoIcon, PlusIcon } from '../components/icons'
import TodoTree from '../components/TodoTree'
import { computeReorder } from '../lib/todos'
import { STATUS_COLOR } from './Projects'

const FILTERS = ['Åpne', 'Alle', 'Fullført']

function matchesFilter(t, filter) {
  if (filter === 'Åpne') return !t.is_done
  if (filter === 'Fullført') return t.is_done
  return true
}

export default function Todos() {
  const todos = useCollection('project_todos', {
    orderBy: 'created_at',
    ascending: true,
  })
  const projects = useCollection('projects')
  const [filter, setFilter] = useState('Åpne')
  const [addProject, setAddProject] = useState('')
  const [addTitle, setAddTitle] = useState('')
  const [adding, setAdding] = useState(false)

  const loading = todos.loading || projects.loading

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

  const submitAdd = async (e) => {
    e.preventDefault()
    const pid = addProject || projects.rows[0]?.id
    if (!pid || !addTitle.trim()) return
    setAdding(true)
    try {
      await addTodo(pid, addTitle.trim(), null)
      setAddTitle('')
    } finally {
      setAdding(false)
    }
  }

  // Grupper etter prosjekt (i prosjektlistens rekkefolge), kun de med treff.
  const groups = useMemo(() => {
    return projects.rows
      .map((p) => ({
        project: p,
        items: todos.rows.filter((t) => t.project_id === p.id),
      }))
      .filter((g) => g.items.some((t) => matchesFilter(t, filter)))
  }, [projects.rows, todos.rows, filter])

  return (
    <div>
      <PageHeader
        title="Gjøremål"
        description="Alle gjøremål på tvers av prosjektene dine."
      />

      {projects.rows.length > 0 && (
        <Card className="mb-4">
          <form onSubmit={submitAdd} className="flex flex-col gap-2 sm:flex-row">
            <Select
              className="sm:max-w-[12rem]"
              value={addProject || projects.rows[0]?.id || ''}
              onChange={(e) => setAddProject(e.target.value)}
              aria-label="Velg prosjekt"
            >
              {projects.rows.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </Select>
            <Input
              className="flex-1"
              placeholder="Nytt gjøremål ..."
              value={addTitle}
              onChange={(e) => setAddTitle(e.target.value)}
            />
            <Button type="submit" disabled={adding || !addTitle.trim()}>
              <PlusIcon className="h-4 w-4" /> Legg til
            </Button>
          </form>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-7 w-7" />
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={ListTodoIcon}
          title="Ingen gjøremål her"
          description={
            projects.rows.length === 0
              ? 'Lag et prosjekt først, så kan du legge til gjøremål.'
              : 'Legg til et gjøremål over.'
          }
        />
      ) : (
        <div className="space-y-4">
          {groups.map(({ project, items }) => {
            const done = items.filter((t) => t.is_done).length
            return (
              <Card key={project.id}>
                <div className="mb-2 flex items-center gap-2">
                  <Link
                    to="/projects"
                    className="font-semibold hover:underline"
                  >
                    {project.title}
                  </Link>
                  <Badge color={STATUS_COLOR[project.status] ?? 'slate'}>
                    {project.status}
                  </Badge>
                  <span className="ml-auto text-xs text-slate-400">
                    {done}/{items.length}
                  </span>
                </div>
                <TodoTree
                  todos={items}
                  filter={filter}
                  allowAdd={filter !== 'Fullført'}
                  onAdd={(title, parentId) =>
                    addTodo(project.id, title, parentId)
                  }
                  onToggle={toggleTodo}
                  onSaveEdit={saveTodoEdit}
                  onDelete={deleteTodo}
                  onMove={moveTodo}
                />
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
