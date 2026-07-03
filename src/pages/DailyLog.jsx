import { useState } from 'react'
import { useCollection } from '../hooks/useCollection'
import {
  Button,
  Card,
  Field,
  Input,
  Textarea,
  Modal,
  EmptyState,
  PageHeader,
  Spinner,
} from '../components/ui'
import { EditIcon, TrashIcon, PencilIcon } from '../components/icons'
import { formatDate, todayISO } from '../lib/format'

export default function DailyLog() {
  const { rows, loading, insert, update, remove } = useCollection('daily_logs', {
    orderBy: 'log_date',
  })

  // Hurtig-notat øverst
  const [quick, setQuick] = useState('')
  const [quickDate, setQuickDate] = useState(todayISO())
  const [adding, setAdding] = useState(false)

  // Redigering i modal
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ content: '', log_date: todayISO() })
  const [saving, setSaving] = useState(false)

  const addQuick = async (e) => {
    e.preventDefault()
    if (!quick.trim()) return
    setAdding(true)
    try {
      await insert({ content: quick.trim(), log_date: quickDate })
      setQuick('')
    } finally {
      setAdding(false)
    }
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({ content: row.content ?? '', log_date: row.log_date ?? todayISO() })
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await update(editing.id, form)
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (row) => {
    if (confirm('Slette denne oppføringen?')) await remove(row.id)
  }

  return (
    <div>
      <PageHeader
        title="Daglig logg"
        description="Rask notatfunksjon for det du gjorde en gitt dag."
      />

      <Card className="mb-6">
        <form onSubmit={addQuick} className="space-y-3">
          <Textarea
            rows={2}
            placeholder="Hva gjorde du i dag?"
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <Input
              type="date"
              className="max-w-[10rem]"
              value={quickDate}
              onChange={(e) => setQuickDate(e.target.value)}
            />
            <Button type="submit" disabled={adding || !quick.trim()}>
              {adding ? 'Legger til ...' : 'Legg til'}
            </Button>
          </div>
        </form>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-7 w-7" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={PencilIcon}
          title="Ingen logg enda"
          description="Skriv et raskt notat over."
        />
      ) : (
        <ol className="relative space-y-4 border-l border-slate-200 pl-5 dark:border-slate-800">
          {rows.map((row) => (
            <li key={row.id} className="relative">
              <span className="absolute -left-[1.55rem] top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-500" />
              <Card>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-slate-400">
                    {formatDate(row.log_date)}
                  </span>
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
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
                  {row.content}
                </p>
              </Card>
            </li>
          ))}
        </ol>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Rediger oppføring"
      >
        <form onSubmit={save} className="space-y-4">
          <Field label="Dato">
            <Input
              type="date"
              value={form.log_date}
              onChange={(e) =>
                setForm((f) => ({ ...f, log_date: e.target.value }))
              }
            />
          </Field>
          <Field label="Innhold">
            <Textarea
              rows={4}
              value={form.content}
              onChange={(e) =>
                setForm((f) => ({ ...f, content: e.target.value }))
              }
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditing(null)}
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
