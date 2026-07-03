import { useState } from 'react'
import { useCurrentInternship } from '../context/InternshipContext'
import { Button, Select, Modal, Input } from './ui'
import { GearIcon, PlusIcon, EditIcon, TrashIcon } from './icons'

export default function InternshipMenu({ compact = false }) {
  const { internships, currentId, setCurrentId } = useCurrentInternship()
  const [manageOpen, setManageOpen] = useState(false)

  return (
    <div className="flex items-center gap-1">
      <Select
        value={currentId ?? ''}
        onChange={(e) => setCurrentId(e.target.value)}
        className={compact ? 'max-w-[11rem] py-1.5 text-sm' : ''}
        aria-label="Velg internship"
      >
        {internships.map((i) => (
          <option key={i.id} value={i.id}>
            {i.name}
          </option>
        ))}
      </Select>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setManageOpen(true)}
        aria-label="Administrer internships"
      >
        <GearIcon className="h-5 w-5" />
      </Button>
      <ManageModal open={manageOpen} onClose={() => setManageOpen(false)} />
    </div>
  )
}

function ManageModal({ open, onClose }) {
  const { internships, currentId, create, rename, remove } =
    useCurrentInternship()
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)

  const add = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setBusy(true)
    try {
      await create(newName.trim())
      setNewName('')
    } finally {
      setBusy(false)
    }
  }

  const onRename = async (i) => {
    const name = window.prompt('Nytt navn pa internshipet:', i.name)
    if (name && name.trim() && name.trim() !== i.name) {
      await rename(i.id, name.trim())
    }
  }

  const onDelete = async (i) => {
    if (internships.length <= 1) {
      window.alert('Du ma ha minst ett internship.')
      return
    }
    if (
      window.confirm(
        `Slette "${i.name}" og ALL data knyttet til det? Dette kan ikke angres.`,
      )
    ) {
      await remove(i.id)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Administrer internships">
      <div className="space-y-2">
        {internships.map((i) => (
          <div
            key={i.id}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800"
          >
            <span className="flex-1 truncate text-sm">
              {i.name}
              {i.id === currentId && (
                <span className="ml-2 text-xs text-indigo-500">(valgt)</span>
              )}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRename(i)}
              aria-label="Gi nytt navn"
            >
              <EditIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(i)}
              aria-label="Slett"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <form
        onSubmit={add}
        className="mt-4 flex gap-2 border-t border-slate-200 pt-4 dark:border-slate-800"
      >
        <Input
          className="flex-1"
          placeholder="Nytt internship ..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <Button type="submit" disabled={busy || !newName.trim()}>
          <PlusIcon className="h-4 w-4" /> Legg til
        </Button>
      </form>
    </Modal>
  )
}
