import { useRef, useState } from 'react'
import { Button, Input } from './ui'
import { readCollapsed, writeCollapsed } from '../lib/collapse'
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  GripIcon,
  ChevronRightIcon,
} from './icons'

function matchesFilter(t, filter) {
  if (filter === 'Åpne') return !t.is_done
  if (filter === 'Fullført') return t.is_done
  return true
}

const bySort = (a, b) =>
  (a.position ?? 0) - (b.position ?? 0) ||
  new Date(a.created_at) - new Date(b.created_at)

/**
 * Gjenbrukbar gjoremal-liste med:
 *  - under-gjoremal (ett niva)
 *  - inline-redigering
 *  - skjul/vis under-gjoremal
 *  - dra for a flytte (over/under) eller gjore om til under-gjoremal (midten)
 *
 * Dra-modell: hele raden er et slippe-mal. Musepekerens posisjon i raden
 * bestemmer resultatet: overste 30% = legg over, nederste 30% = legg under,
 * midten = gjor til under-gjoremal (kun pa hovedgjoremal). Slipper du over/
 * under et hovedgjoremal, havner den pa hovedniva (slik drar du den "ut").
 */
export default function TodoTree({
  todos,
  onAdd,
  onToggle,
  onSaveEdit,
  onDelete,
  onMove,
  filter = 'Alle',
  allowAdd = true,
}) {
  const [newTop, setNewTop] = useState('')
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [dragId, setDragId] = useState(null)
  const [hint, setHint] = useState(null) // { id, mode: 'before'|'after'|'child' }

  const canAdd = allowAdd && filter !== 'Fullført'
  const parents = todos.filter((t) => !t.parent_id).sort(bySort)
  const childrenOf = (id) => todos.filter((t) => t.parent_id === id).sort(bySort)
  const dragged = todos.find((t) => t.id === dragId)
  const draggedHasKids =
    !!dragged && todos.some((t) => t.parent_id === dragged.id)

  const toggleCollapse = (id) => {
    const next = readCollapsed()
    next.has(id) ? next.delete(id) : next.add(id)
    writeCollapsed(next)
    setCollapsed(next)
  }

  const clearDrag = () => {
    setDragId(null)
    setHint(null)
  }

  const nextSiblingId = (list, id) => {
    const i = list.findIndex((s) => s.id === id)
    return i >= 0 && i < list.length - 1 ? list[i + 1].id : null
  }

  const modeFor = (e, isTop) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const h = rect.height || 1
    const canChild = isTop && !draggedHasKids
    if (canChild) {
      if (y < h * 0.3) return 'before'
      if (y > h * 0.7) return 'after'
      return 'child'
    }
    return y < h / 2 ? 'before' : 'after'
  }

  const onRowOver = (e, target, isTop) => {
    if (!dragId || dragId === target.id) return
    e.preventDefault()
    setHint({ id: target.id, mode: modeFor(e, isTop) })
  }

  const onRowDrop = (e, target, isTop) => {
    if (!dragId || dragId === target.id) {
      clearDrag()
      return
    }
    e.preventDefault()
    const mode = modeFor(e, isTop)
    let parentId
    let beforeId
    if (mode === 'child') {
      parentId = target.id
      beforeId = null
    } else {
      parentId = target.parent_id ?? null
      const group = parentId ? childrenOf(parentId) : parents
      beforeId = mode === 'before' ? target.id : nextSiblingId(group, target.id)
    }
    if (parentId !== dragId && beforeId !== dragId) {
      onMove(dragId, parentId, beforeId)
    }
    clearDrag()
  }

  const wrapClass = (id) => {
    const m = hint?.id === id ? hint.mode : null
    return `rounded ${m === 'child' ? 'ring-2 ring-indigo-400' : ''} ${
      m === 'before' ? 'border-t-2 border-indigo-500' : ''
    } ${m === 'after' ? 'border-b-2 border-indigo-500' : ''}`
  }

  const submitTop = async (e) => {
    e.preventDefault()
    if (!newTop.trim()) return
    await onAdd(newTop.trim(), null)
    setNewTop('')
  }

  return (
    <div>
      <ul className="space-y-1">
        {parents.map((p) => {
          const kids = childrenOf(p.id)
          const visibleKids = kids.filter((k) => matchesFilter(k, filter))
          if (!matchesFilter(p, filter) && visibleKids.length === 0) return null
          const isCollapsed = collapsed.has(p.id)
          return (
            <li key={p.id}>
              <div
                onDragOver={(e) => onRowOver(e, p, true)}
                onDrop={(e) => onRowDrop(e, p, true)}
                className={wrapClass(p.id)}
              >
                <TodoRow
                  todo={p}
                  onToggle={onToggle}
                  onSaveEdit={onSaveEdit}
                  onDelete={onDelete}
                  onAddSub={canAdd ? (title) => onAdd(title, p.id) : null}
                  onDragStart={setDragId}
                  onDragEnd={clearDrag}
                  hasKids={kids.length > 0}
                  kidCount={kids.length}
                  collapsed={isCollapsed}
                  onToggleCollapse={() => toggleCollapse(p.id)}
                />
              </div>
              {!isCollapsed && visibleKids.length > 0 && (
                <ul className="ml-5 mt-1 space-y-1 border-l border-slate-200 pl-4 dark:border-slate-700">
                  {visibleKids.map((k) => (
                    <li key={k.id}>
                      <div
                        onDragOver={(e) => onRowOver(e, k, false)}
                        onDrop={(e) => onRowDrop(e, k, false)}
                        className={wrapClass(k.id)}
                      >
                        <TodoRow
                          todo={k}
                          onToggle={onToggle}
                          onSaveEdit={onSaveEdit}
                          onDelete={onDelete}
                          onDragStart={setDragId}
                          onDragEnd={clearDrag}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>

      {canAdd && (
        <form onSubmit={submitTop} className="mt-2 flex gap-1">
          <Input
            className="py-1 text-sm"
            placeholder="Nytt gjøremål ..."
            value={newTop}
            onChange={(e) => setNewTop(e.target.value)}
          />
          <Button size="icon" type="submit" aria-label="Legg til gjøremål">
            <PlusIcon className="h-4 w-4" />
          </Button>
        </form>
      )}
    </div>
  )
}

function TodoRow({
  todo,
  onToggle,
  onSaveEdit,
  onDelete,
  onAddSub = null,
  onDragStart,
  onDragEnd,
  hasKids = false,
  kidCount = 0,
  collapsed = false,
  onToggleCollapse = null,
}) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(todo.title)
  const [addingSub, setAddingSub] = useState(false)
  const [subText, setSubText] = useState('')
  const [dragging, setDragging] = useState(false)
  const rowRef = useRef(null)

  const save = async () => {
    const v = text.trim()
    if (v && v !== todo.title) await onSaveEdit(todo.id, v)
    setEditing(false)
  }
  const cancel = () => {
    setText(todo.title)
    setEditing(false)
  }
  const submitSub = async (e) => {
    e.preventDefault()
    if (!subText.trim()) return
    await onAddSub(subText.trim())
    setSubText('')
    setAddingSub(false)
  }

  return (
    <div>
      <div
        ref={rowRef}
        className={`group/todo flex items-center gap-1.5 rounded px-1 py-1 text-sm transition-opacity hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
          dragging ? 'opacity-40' : ''
        }`}
      >
        <span
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move'
            e.dataTransfer.setData('text/plain', todo.id)
            const el = rowRef.current
            if (el) {
              const rect = el.getBoundingClientRect()
              e.dataTransfer.setDragImage(
                el,
                e.clientX - rect.left,
                e.clientY - rect.top,
              )
            }
            setDragging(true)
            onDragStart(todo.id)
          }}
          onDragEnd={() => {
            setDragging(false)
            onDragEnd()
          }}
          aria-label="Dra for å flytte"
          className="cursor-grab text-slate-300 opacity-100 transition-opacity hover:text-slate-500 active:cursor-grabbing md:opacity-0 md:group-hover/todo:opacity-100 dark:text-slate-600"
        >
          <GripIcon className="h-4 w-4" />
        </span>

        {hasKids ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Vis undergjøremål' : 'Skjul undergjøremål'}
            className="flex items-center text-slate-400 hover:text-slate-600"
          >
            <ChevronRightIcon
              className={`h-4 w-4 transition-transform ${
                collapsed ? '' : 'rotate-90'
              }`}
            />
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        <input
          type="checkbox"
          checked={todo.is_done}
          onChange={() => onToggle(todo)}
          className="h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
        />

        {editing ? (
          <>
            <Input
              className="py-1 text-sm"
              value={text}
              autoFocus
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  save()
                }
                if (e.key === 'Escape') cancel()
              }}
            />
            <Button size="sm" onClick={save}>
              Lagre
            </Button>
            <Button size="sm" variant="ghost" onClick={cancel}>
              Avbryt
            </Button>
          </>
        ) : (
          <>
            <span
              className={`flex-1 ${
                todo.is_done
                  ? 'text-slate-400 line-through'
                  : 'text-slate-700 dark:text-slate-200'
              }`}
            >
              {todo.title}
              {hasKids && collapsed && (
                <span className="ml-1 text-xs text-slate-400">
                  ({kidCount})
                </span>
              )}
            </span>
            <span className="flex items-center gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover/todo:opacity-100 md:focus-within:opacity-100">
              {onAddSub && (
                <button
                  type="button"
                  onClick={() => setAddingSub((s) => !s)}
                  aria-label="Legg til undergjøremål"
                  className="text-slate-400 hover:text-indigo-500"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setText(todo.title)
                  setEditing(true)
                }}
                aria-label="Rediger"
                className="text-slate-400 hover:text-indigo-500"
              >
                <EditIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(todo)}
                aria-label="Slett"
                className="text-slate-400 hover:text-red-500"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </span>
          </>
        )}
      </div>

      {addingSub && onAddSub && (
        <form onSubmit={submitSub} className="ml-6 mt-1 flex gap-1">
          <Input
            className="py-1 text-sm"
            placeholder="Nytt undergjøremål ..."
            value={subText}
            autoFocus
            onChange={(e) => setSubText(e.target.value)}
          />
          <Button size="icon" type="submit" aria-label="Legg til">
            <PlusIcon className="h-4 w-4" />
          </Button>
        </form>
      )}
    </div>
  )
}
