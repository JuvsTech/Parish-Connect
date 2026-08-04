/**
 * Global text formatting helpers for Parish Connect.
 * Person names are always stored in Proper Case in Firestore.
 */

const ROMAN_NUMERAL =
  /^(?=[MDCLXVI])M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/i

/**
 * Formats a single whitespace-delimited token into Proper Case,
 * preserving hyphens, apostrophes, Jr./Sr., and Roman numerals.
 *
 * @param {string} token
 * @returns {string}
 */
function formatNameToken(token) {
  const raw = String(token ?? '')
  if (!raw) return ''

  const bare = raw.replace(/\./g, '').toLowerCase()
  if (bare === 'jr') return 'Jr.'
  if (bare === 'sr') return 'Sr.'

  if (ROMAN_NUMERAL.test(raw)) {
    return raw.toUpperCase()
  }

  if (raw.includes('-')) {
    return raw
      .split('-')
      .map((part) => formatNameToken(part))
      .join('-')
  }

  if (raw.includes("'")) {
    return raw
      .split("'")
      .map((part) => {
        if (!part) return part
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      })
      .join("'")
  }

  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
}

/**
 * Converts any person-name string to Proper Case for storage and display.
 *
 * - Trims leading/trailing whitespace
 * - Collapses repeated spaces
 * - Capitalizes each word
 * - Preserves hyphenated names (Mary-Jane)
 * - Preserves apostrophes (O'Brien)
 * - Preserves Roman numerals (III, IV)
 * - Normalizes Jr / Sr → Jr. / Sr.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function toProperCase(value) {
  const text = String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')

  if (!text) return ''

  return text
    .split(' ')
    .map((token) => formatNameToken(token))
    .join(' ')
}

/**
 * Alias used by Firestore document builders for person-name fields.
 * @param {unknown} value
 * @returns {string}
 */
export function normalizePersonName(value) {
  return toProperCase(value)
}
