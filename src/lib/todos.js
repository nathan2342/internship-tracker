// Beregner hvilke rader som ma oppdateres nar et gjoremal flyttes/nostes.
// Returnerer en liste med { id, parent_id, position } for den nye
// soskengruppen (kun radene som faktisk endrer seg).
export function computeReorder(rows, dragId, newParentId, beforeId) {
  const norm = (v) => v ?? null
  const target = norm(newParentId)
  const dragged = rows.find((r) => r.id === dragId)
  if (!dragged) return []

  const siblings = rows
    .filter((r) => norm(r.parent_id) === target && r.id !== dragId)
    .sort(
      (a, b) =>
        (a.position ?? 0) - (b.position ?? 0) ||
        new Date(a.created_at) - new Date(b.created_at),
    )

  let idx = beforeId ? siblings.findIndex((s) => s.id === beforeId) : siblings.length
  if (idx < 0) idx = siblings.length

  const ordered = [...siblings.slice(0, idx), dragged, ...siblings.slice(idx)]

  const updates = []
  ordered.forEach((r, i) => {
    if (r.id === dragId || (r.position ?? 0) !== i) {
      updates.push({ id: r.id, parent_id: target, position: i })
    }
  })
  return updates
}
