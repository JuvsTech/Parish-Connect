/**
 * Title ↔ Position compatibility for Manage Ministers.
 *
 * Extend TITLE_POSITION_MAP when adding a new Title — the form filters
 * positions from this map and does not hardcode rules itself.
 */

/** Existing minister titles used in the application. */
export const MINISTER_TITLE_OPTIONS = [
  'Rev. Fr.',
  'Fr.',
  'Bishop',
  'Archbishop',
  'Msgr.',
  'Rev.',
  'Deacon',
  'Bro.',
  'Sister',
]

/**
 * Master list of positions (union of all mapped roles).
 * Includes non-priest roles needed for Bro. / Sister titles.
 */
export const MINISTER_POSITION_OPTIONS = [
  'Parish Priest',
  'Assistant Parish Priest',
  'Parochial Vicar',
  'Visiting Priest',
  'Bishop',
  'Archbishop',
  'Deacon',
  'Religious Brother',
  'Religious Sister',
  'Seminarian',
]

const PRIEST_POSITIONS = [
  'Parish Priest',
  'Assistant Parish Priest',
  'Parochial Vicar',
  'Visiting Priest',
]

const MSGR_POSITIONS = [
  'Parish Priest',
  'Assistant Parish Priest',
  'Parochial Vicar',
]

/**
 * Allowed positions for each title.
 * Add or adjust entries here only — no form changes required.
 */
export const TITLE_POSITION_MAP = {
  'Rev. Fr.': [...PRIEST_POSITIONS],
  'Fr.': [...PRIEST_POSITIONS],
  'Msgr.': [...MSGR_POSITIONS],
  'Rev.': [...PRIEST_POSITIONS],
  Bishop: ['Bishop'],
  Archbishop: ['Archbishop'],
  Deacon: ['Deacon'],
  'Bro.': ['Religious Brother', 'Seminarian'],
  Sister: ['Religious Sister'],
}

export const DEFAULT_MINISTER_TITLE = 'Rev. Fr.'

/**
 * Normalizes legacy title values (e.g. "Sr." → "Sister").
 * @param {unknown} title
 * @returns {string}
 */
export function normalizeMinisterTitle(title) {
  const key = String(title || '').trim()
  if (key === 'Sr.' || key.toLowerCase() === 'sr.') return 'Sister'
  return key
}

export function getPositionsForTitle(title) {
  const key = normalizeMinisterTitle(title)
  if (!key) return []
  const mapped = TITLE_POSITION_MAP[key]
  return Array.isArray(mapped) ? [...mapped] : []
}

export function getDefaultPositionForTitle(title) {
  return getPositionsForTitle(title)[0] || ''
}

export function isValidTitlePosition(title, position) {
  const allowed = getPositionsForTitle(title)
  const value = String(position || '').trim()
  if (!value) return false
  return allowed.includes(value)
}

/**
 * Friendly validation message for an invalid (or empty) Title/Position pair.
 * Returns '' when the combination is valid.
 */
export function getTitlePositionError(title, position) {
  const titleValue = normalizeMinisterTitle(title)
  const positionValue = String(position || '').trim()

  if (!titleValue) return 'Title is required.'
  if (!positionValue) return 'Position is required.'

  const allowed = getPositionsForTitle(titleValue)
  if (allowed.length === 0) {
    return `No positions are configured for title "${titleValue}".`
  }

  if (!allowed.includes(positionValue)) {
    return `"${titleValue}" cannot be combined with "${positionValue}". Choose a compatible position.`
  }

  return ''
}
