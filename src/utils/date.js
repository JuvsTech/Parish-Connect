/**
 * Formats a Firestore Timestamp, Date, or date-like value for UI display.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function formatFirestoreDate(value) {
  if (!value) return '-'

  let date
  if (typeof value?.toDate === 'function') {
    date = value.toDate()
  } else if (value instanceof Date) {
    date = value
  } else if (typeof value === 'string' || typeof value === 'number') {
    date = new Date(
      typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? `${value}T00:00:00`
        : value,
    )
  } else {
    return '-'
  }

  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

/**
 * Formats an HTML date input value (yyyy-mm-dd) for display.
 *
 * @param {string} isoDate
 * @returns {string}
 */
export function formatDisplayDate(isoDate) {
  if (!isoDate) return '-'
  return formatFirestoreDate(isoDate)
}

/**
 * Converts a display date string to yyyy-mm-dd for date inputs.
 *
 * @param {string} displayDate
 * @returns {string}
 */
export function parseDisplayDate(displayDate) {
  if (!displayDate || displayDate === '-') return ''

  const date = new Date(displayDate)
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Converts a yyyy-mm-dd string to a Date at local midnight.
 *
 * @param {string} isoDate
 * @returns {Date|null}
 */
export function toLocalDate(isoDate) {
  if (!isoDate) return null
  const date = new Date(`${isoDate}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Computes whole-year age from a birth date (Date, Timestamp, or yyyy-mm-dd).
 *
 * @param {unknown} birthValue
 * @param {Date} [asOf]
 * @returns {number|null}
 */
export function computeAgeFromDateOfBirth(birthValue, asOf = new Date()) {
  let birth = null

  if (birthValue instanceof Date) {
    birth = birthValue
  } else if (typeof birthValue?.toDate === 'function') {
    birth = birthValue.toDate()
  } else if (typeof birthValue === 'string') {
    birth = toLocalDate(birthValue)
  }

  if (!birth || Number.isNaN(birth.getTime()) || Number.isNaN(asOf.getTime())) {
    return null
  }

  let age = asOf.getFullYear() - birth.getFullYear()
  const monthDelta = asOf.getMonth() - birth.getMonth()
  if (monthDelta < 0 || (monthDelta === 0 && asOf.getDate() < birth.getDate())) {
    age -= 1
  }

  return age >= 0 ? age : null
}
