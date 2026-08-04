/** Sacramental responsibilities a minister may be assigned to. */
export const MINISTER_ASSIGNMENT_OPTIONS = [
  'Baptism',
  'Confirmation',
  'Marriage',
  'Burial',
  'Conversion',
]

/** Map legacy single-assignment labels onto current options. */
const LEGACY_ASSIGNMENT_ALIASES = {
  death: 'Burial',
  burial: 'Burial',
  baptism: 'Baptism',
  confirmation: 'Confirmation',
  marriage: 'Marriage',
  conversion: 'Conversion',
}

/**
 * Normalize any stored minister assignment shape into a unique ordered array.
 * Supports:
 * - assignments: string[]
 * - assignment / parish / parishAssignment: single string
 * - legacy "Death" → "Burial"
 */
export function normalizeMinisterAssignments(data = {}) {
  const source = data && typeof data === 'object' ? data : {}
  const raw = []

  if (Array.isArray(source.assignments)) {
    raw.push(...source.assignments)
  } else if (typeof source.assignments === 'string' && source.assignments.trim()) {
    raw.push(
      ...source.assignments
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean),
    )
  }

  for (const key of ['assignment', 'parish', 'parishAssignment']) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) {
      raw.push(value.trim())
    }
  }

  const seen = new Set()
  const normalized = []

  for (const item of raw) {
    const text = String(item || '').trim()
    if (!text) continue
    const alias = LEGACY_ASSIGNMENT_ALIASES[text.toLowerCase()]
    const value = alias || text
    if (!MINISTER_ASSIGNMENT_OPTIONS.includes(value)) continue
    if (seen.has(value)) continue
    seen.add(value)
    normalized.push(value)
  }

  // Preserve known option order for stable UI display.
  return MINISTER_ASSIGNMENT_OPTIONS.filter((option) =>
    normalized.includes(option),
  )
}

export function ministerHasAssignment(minister, assignment) {
  if (!assignment) return true
  const list = Array.isArray(minister?.assignments)
    ? minister.assignments
    : normalizeMinisterAssignments(minister || {})
  return list.includes(assignment)
}
