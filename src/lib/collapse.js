// Husker hvilke gjoremal som er slatt sammen, pa tvers av faner og re-render.
const KEY = 'collapsedTodos'

export function readCollapsed() {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) || '[]'))
  } catch {
    return new Set()
  }
}

export function writeCollapsed(set) {
  localStorage.setItem(KEY, JSON.stringify([...set]))
}
