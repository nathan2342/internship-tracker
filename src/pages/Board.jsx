import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useCollection } from '../hooks/useCollection'
import { Button, PageHeader, Spinner } from '../components/ui'
import { PlusIcon, XIcon, EditIcon, NoteIcon } from '../components/icons'

// Statiske klasser (Tailwind maa se dem i kildekoden).
const COLORS = {
  yellow: 'bg-yellow-100',
  pink: 'bg-pink-200',
  green: 'bg-green-200',
  blue: 'bg-blue-200',
  purple: 'bg-purple-200',
  orange: 'bg-orange-200',
  gray: 'bg-slate-200',
}
const SWATCH = {
  yellow: 'bg-yellow-300',
  pink: 'bg-pink-400',
  green: 'bg-green-400',
  blue: 'bg-blue-400',
  purple: 'bg-purple-400',
  orange: 'bg-orange-400',
  gray: 'bg-slate-400',
}
const COLOR_KEYS = Object.keys(COLORS)

async function uploadImage(file, userId) {
  const ext = (file.name.split('.').pop() || 'png').toLowerCase()
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from('note-images')
    .upload(path, file, { upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('note-images').getPublicUrl(path)
  return data.publicUrl
}

export default function Board() {
  const { user } = useAuth()
  const notes = useCollection('notes', { orderBy: 'created_at', ascending: true })
  const [colorFilter, setColorFilter] = useState(() => new Set())
  const [tagFilter, setTagFilter] = useState(() => new Set())

  const allTags = useMemo(() => {
    const s = new Set()
    for (const n of notes.rows) for (const t of n.tags ?? []) s.add(t)
    return [...s].sort()
  }, [notes.rows])

  const maxZ = notes.rows.reduce((m, n) => Math.max(m, n.z || 0), 0)

  const canvasHeight = notes.rows.reduce(
    (h, n) => Math.max(h, (n.y || 0) + (n.height || 220) + 100),
    600,
  )

  const visible = notes.rows.filter((n) => {
    const okColor = colorFilter.size === 0 || colorFilter.has(n.color)
    const okTag =
      tagFilter.size === 0 || (n.tags ?? []).some((t) => tagFilter.has(t))
    return okColor && okTag
  })

  const addNote = () => {
    const k = notes.rows.length % 8
    notes.insert({
      content: '',
      color: 'yellow',
      tags: [],
      x: 32 + k * 28,
      y: 32 + k * 28,
      z: maxZ + 1,
    })
  }

  const changeNote = (id, values) => notes.update(id, values)
  const deleteNote = (id) => notes.remove(id)
  const bringToFront = (n) => {
    if (n.z !== maxZ) notes.update(n.id, { z: maxZ + 1 })
  }

  const toggle = (setState, value) =>
    setState((prev) => {
      const next = new Set(prev)
      next.has(value) ? next.delete(value) : next.add(value)
      return next
    })

  return (
    <div>
      <div className="px-4 pt-6 md:px-8">
        <PageHeader
          title="Tavle"
          description="Fri notatflate. Dra lappene rundt, endre størrelse, gi farge, etiketter og bilder."
          action={
            <Button onClick={addNote}>
              <PlusIcon className="h-4 w-4" /> Ny lapp
            </Button>
          }
        />

        {/* Filtre */}
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            {COLOR_KEYS.map((c) => (
              <button
                key={c}
                onClick={() => toggle(setColorFilter, c)}
                aria-label={`Filtrer ${c}`}
                className={`h-5 w-5 rounded-full ${SWATCH[c]} ${
                  colorFilter.has(c)
                    ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-950'
                    : 'opacity-70'
                }`}
              />
            ))}
          </div>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {allTags.map((t) => (
                <button
                  key={t}
                  onClick={() => toggle(setTagFilter, t)}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    tagFilter.has(t)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
          {(colorFilter.size > 0 || tagFilter.size > 0) && (
            <button
              onClick={() => {
                setColorFilter(new Set())
                setTagFilter(new Set())
              }}
              className="text-xs text-slate-500 underline"
            >
              Nullstill filter
            </button>
          )}
        </div>
      </div>

      {notes.loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-7 w-7" />
        </div>
      ) : (
        <div
          className="relative w-full"
          style={{
            minHeight: '70vh',
            height: canvasHeight,
            backgroundImage:
              'radial-gradient(circle, rgba(100,116,139,0.18) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        >
          {notes.rows.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center text-slate-400">
              <NoteIcon className="mb-2 h-8 w-8" />
              <p className="text-sm">Trykk «Ny lapp» for å starte tavla.</p>
            </div>
          )}
          {visible.map((n) => (
            <NoteCard
              key={n.id}
              note={n}
              userId={user?.id}
              onChange={changeNote}
              onDelete={deleteNote}
              onFront={() => bringToFront(n)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function NoteCard({ note, userId, onChange, onDelete, onFront }) {
  const [pos, setPos] = useState({ x: note.x, y: note.y })
  const [size, setSize] = useState({
    w: note.width || 260,
    h: note.height || 220,
  })
  const [content, setContent] = useState(note.content ?? '')
  const [tagInput, setTagInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showColors, setShowColors] = useState(false)
  const rootRef = useRef(null)
  const moveRef = useRef(null)
  const resizeRef = useRef(null)

  useEffect(() => setPos({ x: note.x, y: note.y }), [note.x, note.y])
  useEffect(
    () => setSize({ w: note.width || 260, h: note.height || 220 }),
    [note.width, note.height],
  )
  useEffect(() => setContent(note.content ?? ''), [note.content])

  // --- Flytting ---
  const onMoveDown = (e) => {
    if (e.target.closest('button, textarea, input, [data-resize]')) return
    onFront()
    moveRef.current = {
      sx: e.clientX,
      sy: e.clientY,
      ox: pos.x,
      oy: pos.y,
      moved: false,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onMoveMove = (e) => {
    if (!moveRef.current) return
    const dx = e.clientX - moveRef.current.sx
    const dy = e.clientY - moveRef.current.sy
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moveRef.current.moved = true
    const canvas = rootRef.current?.parentElement
    const maxX = canvas ? canvas.clientWidth - size.w : Infinity
    setPos({
      x: Math.min(Math.max(0, moveRef.current.ox + dx), maxX),
      y: Math.max(0, moveRef.current.oy + dy),
    })
  }
  const onMoveUp = () => {
    if (!moveRef.current) return
    const moved = moveRef.current.moved
    moveRef.current = null
    if (moved) onChange(note.id, { x: Math.round(pos.x), y: Math.round(pos.y) })
  }

  // --- Endre storrelse ---
  const onResizeDown = (e) => {
    e.stopPropagation()
    resizeRef.current = { sx: e.clientX, sy: e.clientY, ow: size.w, oh: size.h }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onResizeMove = (e) => {
    if (!resizeRef.current) return
    const dx = e.clientX - resizeRef.current.sx
    const dy = e.clientY - resizeRef.current.sy
    setSize({
      w: Math.max(180, resizeRef.current.ow + dx),
      h: Math.max(140, resizeRef.current.oh + dy),
    })
  }
  const onResizeUp = () => {
    if (!resizeRef.current) return
    resizeRef.current = null
    onChange(note.id, {
      width: Math.round(size.w),
      height: Math.round(size.h),
    })
  }

  const saveContent = () => {
    if (content !== note.content) onChange(note.id, { content })
  }

  const addTag = (e) => {
    e.preventDefault()
    const t = tagInput.trim()
    if (!t) return
    if (!(note.tags ?? []).includes(t))
      onChange(note.id, { tags: [...(note.tags ?? []), t] })
    setTagInput('')
  }
  const removeTag = (t) =>
    onChange(note.id, { tags: (note.tags ?? []).filter((x) => x !== t) })

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file, userId)
      onChange(note.id, { image_url: url })
    } catch (err) {
      alert('Kunne ikke laste opp bilde: ' + err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div
      ref={rootRef}
      onPointerDown={onMoveDown}
      onPointerMove={onMoveMove}
      onPointerUp={onMoveUp}
      className={`group absolute flex touch-none flex-col rounded-lg text-slate-900 shadow-lg ${
        COLORS[note.color] ?? COLORS.yellow
      }`}
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h, zIndex: note.z }}
    >
      {/* Hjorne-knapper (vises ved hover, alltid pa mobil) */}
      <div className="absolute right-1 top-1 z-10 flex gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
        <button
          onClick={() => setShowColors((s) => !s)}
          aria-label="Endre farge"
          className="rounded bg-black/10 p-1 text-slate-700 hover:bg-black/20"
        >
          <EditIcon className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete(note.id)}
          aria-label="Slett lapp"
          className="rounded bg-black/10 p-1 text-slate-700 hover:bg-red-500 hover:text-white"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {showColors && (
        <div className="absolute right-1 top-9 z-10 flex gap-1 rounded-lg bg-white p-1.5 shadow-lg dark:bg-slate-800">
          {COLOR_KEYS.map((c) => (
            <button
              key={c}
              onClick={() => {
                onChange(note.id, { color: c })
                setShowColors(false)
              }}
              aria-label={c}
              className={`h-4 w-4 rounded-full ${SWATCH[c]} ${
                note.color === c ? 'ring-2 ring-black/40' : ''
              }`}
            />
          ))}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col p-2 pt-3">
        {note.image_url && (
          <div className="relative mb-2 shrink-0">
            <img
              src={note.image_url}
              alt=""
              className="max-h-40 w-full rounded object-cover"
            />
            <button
              onClick={() => onChange(note.id, { image_url: null })}
              className="absolute right-1 top-1 rounded bg-black/50 p-0.5 text-white hover:bg-red-500"
              aria-label="Fjern bilde"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={saveContent}
          placeholder="Skriv ..."
          className="min-h-0 flex-1 resize-none bg-transparent text-sm placeholder-slate-500 focus:outline-none"
        />

        {(note.tags ?? []).length > 0 && (
          <div className="mt-1 flex shrink-0 flex-wrap gap-1">
            {note.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full bg-black/10 px-2 py-0.5 text-xs"
              >
                {t}
                <button
                  onClick={() => removeTag(t)}
                  aria-label={`Fjern ${t}`}
                  className="hover:text-red-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="mt-2 flex shrink-0 items-center gap-2">
          <form onSubmit={addTag} className="flex-1">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="+ etikett"
              className="w-full bg-transparent text-xs placeholder-slate-500 focus:outline-none"
            />
          </form>
          <label className="shrink-0 cursor-pointer text-xs underline">
            {uploading ? 'Laster ...' : 'Bilde'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFile}
            />
          </label>
        </div>
      </div>

      {/* Endre storrelse (nede til hoyre) */}
      <div
        data-resize
        onPointerDown={onResizeDown}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeUp}
        className="absolute bottom-0 right-0 h-5 w-5 cursor-se-resize touch-none"
        style={{
          backgroundImage:
            'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.25) 50%)',
          borderBottomRightRadius: '0.5rem',
        }}
        aria-label="Endre størrelse"
      />
    </div>
  )
}
