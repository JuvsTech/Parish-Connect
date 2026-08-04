/**
 * Date helpers for official certificate phrasing
 * (e.g. "the 15th day of January, 2026").
 */

function toDate(value) {
  if (!value) return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  if (typeof value?.toDate === 'function') {
    const date = value.toDate()
    return Number.isNaN(date.getTime()) ? null : date
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(
      typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? `${value}T00:00:00`
        : value,
    )
    return Number.isNaN(date.getTime()) ? null : date
  }
  return null
}

export function getOrdinalDay(day) {
  const n = Number(day)
  if (!Number.isInteger(n) || n < 1) return ''
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}

/**
 * @param {unknown} value
 */
export function formatCertificateLongDate(value) {
  const date = toDate(value)
  if (!date) {
    return {
      dayOrdinal: '',
      monthYear: '',
      fullPhrase: '',
      date: null,
    }
  }

  const dayOrdinal = getOrdinalDay(date.getDate())
  const monthYear = date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return {
    dayOrdinal,
    monthYear,
    fullPhrase: `the ${dayOrdinal} day of ${monthYear}`,
    date,
  }
}

/**
 * @param {unknown} [value]
 */
export function formatCertificateIssuedDate(value = new Date()) {
  const date = toDate(value) || new Date()
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
