import { useState } from 'react'
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
import { PlusIcon, EditIcon, TrashIcon, BulbIcon } from '../components/icons'
import { formatDate, todayISO } from '../lib/format'

const CATEGORIES = ['Teknisk', 'Kommunikasjon', 'Verktøy', 'Annet']
const CATEGORY_COLOR = {
  Teknisk: 'indigo',
  Kommunikasjon: 'green',
  Verktøy: 'blue',
  Annet: 'slate',
}

const empty = {
  title: '',
  description: '',
  category: 'Teknisk',
  learned_date: todayISO(),
}

export default function Learnings() {
  const { rows, loading, insert, update, remove } = useCollection('learnings')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('Alle')

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
      category: row.category ?? 'Teknisk',
      learned_date: row.learned_date ?? todayISO(),
    })
    setOpen(true)
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) await update(editing.id, form)
      else await insert(form)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (row) => {
    if (confirm(`Slette "${row.title}"?`)) await remove(row.id)
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const visible =
    filter === 'Alle' ? rows : rows.filter((r) => r.category === filter)

  return (
    <div>
      <PageHeader
        title="Ting jeg har lært"
        description="Korte notater om det du lærer."
        action={
          <Button onClick={openNew}>
            <PlusIcon className="h-4 w-4" /> Nytt notat
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {['Alle', ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              filter === c
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-7 w-7" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={BulbIcon}
          title="Ingen notater her"
          description="Legg til noe du har lært."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visible.map((row) => (
            <Card key={row.id}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{row.title}</h3>
                <div className="flex shrink-0 gap-1">
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
              <div className="mt-3 flex items-center justify-between">
                <Badge color={CATEGORY_COLOR[row.category] ?? 'slate'}>
                  {row.category}
                </Badge>
                {row.learned_date && (
                  <span className="text-xs text-slate-400">
                    {formatDate(row.learned_date)}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Rediger notat' : 'Nytt notat'}
      >
        <form onSubmit={save} className="space-y-4">
          <Field label="Tittel">
            <Input required value={form.title} onChange={set('title')} />
          </Field>
          <Field label="Beskrivelse">
            <Textarea value={form.description} onChange={set('description')} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kategori">
              <Select value={form.category} onChange={set('category')}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Dato">
              <Input
                type="date"
                value={form.learned_date}
                onChange={set('learned_date')}
              />
            </Field>
          </div>
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
