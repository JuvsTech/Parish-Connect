/**
 * Formats a baptism record number for UI display only.
 * Database stores recordYear + recordNumber as numbers.
 *
 * Example: formatBaptismRecordNumber(2026, 1) => "BR-2026-001"
 *
 * @param {number|string|null|undefined} recordYear
 * @param {number|string|null|undefined} recordNumber
 * @returns {string}
 */
export function formatBaptismRecordNumber(recordYear, recordNumber) {
  return formatSacramentalRecordNumber('BR', recordYear, recordNumber)
}

/**
 * Formats a confirmation record number for UI display only.
 * Example: formatConfirmationRecordNumber(2026, 1) => "CR-2026-001"
 *
 * @param {number|string|null|undefined} recordYear
 * @param {number|string|null|undefined} recordNumber
 * @returns {string}
 */
export function formatConfirmationRecordNumber(recordYear, recordNumber) {
  return formatSacramentalRecordNumber('CR', recordYear, recordNumber)
}

/**
 * Formats a marriage record number for UI display only.
 * Example: formatMarriageRecordNumber(2026, 1) => "MR-2026-001"
 *
 * @param {number|string|null|undefined} recordYear
 * @param {number|string|null|undefined} recordNumber
 * @returns {string}
 */
export function formatMarriageRecordNumber(recordYear, recordNumber) {
  return formatSacramentalRecordNumber('MR', recordYear, recordNumber)
}

/**
 * Formats a death record number for UI display only.
 * Example: formatDeathRecordNumber(2026, 1) => "DR-2026-001"
 *
 * @param {number|string|null|undefined} recordYear
 * @param {number|string|null|undefined} recordNumber
 * @returns {string}
 */
export function formatDeathRecordNumber(recordYear, recordNumber) {
  return formatSacramentalRecordNumber('DR', recordYear, recordNumber)
}

/**
 * Formats a conversion record number for UI display only.
 * Example: formatConversionRecordNumber(2026, 1) => "CVR-2026-001"
 *
 * @param {number|string|null|undefined} recordYear
 * @param {number|string|null|undefined} recordNumber
 * @returns {string}
 */
export function formatConversionRecordNumber(recordYear, recordNumber) {
  return formatSacramentalRecordNumber('CVR', recordYear, recordNumber)
}

/**
 * Formats a Mass Intention number for UI display.
 * Example: formatMassIntentionRecordNumber(2026, 1) => "MI-2026-001"
 */
export function formatMassIntentionRecordNumber(recordYear, recordNumber) {
  return formatSacramentalRecordNumber('MI', recordYear, recordNumber)
}

/**
 * @param {'BR'|'CR'|'MR'|'DR'|'CVR'|'MI'} prefix
 * @param {number|string|null|undefined} recordYear
 * @param {number|string|null|undefined} recordNumber
 * @returns {string}
 */
function formatSacramentalRecordNumber(prefix, recordYear, recordNumber) {
  const year = Number(recordYear)
  const number = Number(recordNumber)

  if (!Number.isFinite(year) || !Number.isFinite(number) || number < 1) {
    return '-'
  }

  return `${prefix}-${year}-${String(number).padStart(3, '0')}`
}

/**
 * Parses a formatted baptism record number into numeric parts.
 * Example: "BR-2026-001" => { recordYear: 2026, recordNumber: 1 }
 *
 * @param {string} value
 * @returns {{ recordYear: number, recordNumber: number } | null}
 */
export function parseBaptismRecordNumber(value) {
  const match = String(value || '')
    .trim()
    .match(/^BR-(\d{4})-(\d+)$/i)

  if (!match) return null

  return {
    recordYear: Number(match[1]),
    recordNumber: Number(match[2]),
  }
}

/**
 * Parses a formatted confirmation record number into numeric parts.
 * Example: "CR-2026-001" => { recordYear: 2026, recordNumber: 1 }
 *
 * @param {string} value
 * @returns {{ recordYear: number, recordNumber: number } | null}
 */
export function parseConfirmationRecordNumber(value) {
  const match = String(value || '')
    .trim()
    .match(/^CR-(\d{4})-(\d+)$/i)

  if (!match) return null

  return {
    recordYear: Number(match[1]),
    recordNumber: Number(match[2]),
  }
}

/**
 * Resolves numeric year/number from a record document or UI-mapped object.
 *
 * @param {object} record
 * @returns {{ recordYear: number, recordNumber: number } | null}
 */
export function getRecordNumberParts(record) {
  if (!record) return null

  if (
    record.recordYear != null &&
    record.recordNumber != null &&
    Number.isFinite(Number(record.recordYear)) &&
    Number.isFinite(Number(record.recordNumber))
  ) {
    return {
      recordYear: Number(record.recordYear),
      recordNumber: Number(record.recordNumber),
    }
  }

  if (record.recordNo) {
    return (
      parseBaptismRecordNumber(record.recordNo) ||
      parseConfirmationRecordNumber(record.recordNo) ||
      parsePrefixedRecordNumber(record.recordNo, 'MR') ||
      parsePrefixedRecordNumber(record.recordNo, 'DR') ||
      parsePrefixedRecordNumber(record.recordNo, 'CVR') ||
      parsePrefixedRecordNumber(record.recordNo, 'MI') ||
      parsePrefixedRecordNumber(record.intentionNumber, 'MI')
    )
  }

  if (record.intentionNumber) {
    return parsePrefixedRecordNumber(record.intentionNumber, 'MI')
  }

  return null
}

/**
 * @param {string} value
 * @param {'MR'|'DR'|'CVR'|'MI'} prefix
 * @returns {{ recordYear: number, recordNumber: number } | null}
 */
function parsePrefixedRecordNumber(value, prefix) {
  const match = String(value || '')
    .trim()
    .match(new RegExp(`^${prefix}-(\\d{4})-(\\d+)$`, 'i'))

  if (!match) return null

  return {
    recordYear: Number(match[1]),
    recordNumber: Number(match[2]),
  }
}

/**
 * Returns the next confirmation record number for a selected year.
 * Same sequencing rules as baptism.
 *
 * @param {object[]} records
 * @param {number|string} [recordYear]
 * @returns {{ recordYear: number, recordNumber: number }}
 */
export function getNextConfirmationRecordParts(
  records = [],
  recordYear = new Date().getFullYear(),
) {
  return getNextBaptismRecordParts(records, recordYear)
}

/**
 * Returns the next death record number for a selected year.
 * Same sequencing rules as baptism (resets each year).
 *
 * @param {object[]} records
 * @param {number|string} [recordYear]
 * @returns {{ recordYear: number, recordNumber: number }}
 */
export function getNextDeathRecordParts(
  records = [],
  recordYear = new Date().getFullYear(),
) {
  return getNextBaptismRecordParts(records, recordYear)
}

/**
 * Returns the next conversion record number for a selected year.
 * Same sequencing rules as baptism (resets each year).
 *
 * @param {object[]} records
 * @param {number|string} [recordYear]
 * @returns {{ recordYear: number, recordNumber: number }}
 */
export function getNextConversionRecordParts(
  records = [],
  recordYear = new Date().getFullYear(),
) {
  return getNextBaptismRecordParts(records, recordYear)
}

/**
 * Returns the next Mass Intention number parts for a selected year.
 */
export function getNextMassIntentionRecordParts(
  records = [],
  recordYear = new Date().getFullYear(),
) {
  return getNextBaptismRecordParts(records, recordYear)
}

/**
 * Returns the next marriage record number for a selected year.
 * Same sequencing rules as baptism (resets each year).
 *
 * @param {object[]} records
 * @param {number|string} [recordYear]
 * @returns {{ recordYear: number, recordNumber: number }}
 */
export function getNextMarriageRecordParts(
  records = [],
  recordYear = new Date().getFullYear(),
) {
  return getNextBaptismRecordParts(records, recordYear)
}

/**
 * Returns the next record number for a selected year.
 * Uses the highest existing recordNumber for that recordYear + 1.
 *
 * @param {object[]} records
 * @param {number|string} [recordYear]
 * @returns {{ recordYear: number, recordNumber: number }}
 */
export function getNextBaptismRecordParts(
  records = [],
  recordYear = new Date().getFullYear(),
) {
  const year = Number(recordYear)
  const selectedYear = Number.isInteger(year) && year >= 1000
    ? year
    : new Date().getFullYear()

  let maxSequence = 0

  records.forEach((record) => {
    const parts = getRecordNumberParts(record)
    if (!parts || parts.recordYear !== selectedYear) return
    if (parts.recordNumber > maxSequence) {
      maxSequence = parts.recordNumber
    }
  })

  return {
    recordYear: selectedYear,
    recordNumber: maxSequence + 1,
  }
}

/**
 * Checks whether a year + number combination already exists in local records.
 *
 * @param {object[]} records
 * @param {number} recordYear
 * @param {number} recordNumber
 * @param {string} [excludeId]
 * @returns {boolean}
 */
export function isRecordNumberDuplicate(
  records,
  recordYear,
  recordNumber,
  excludeId,
) {
  return records.some((record) => {
    if (excludeId && record.id === excludeId) return false
    const existing = getRecordNumberParts(record)
    if (!existing) return false
    return (
      existing.recordYear === Number(recordYear) &&
      existing.recordNumber === Number(recordNumber)
    )
  })
}
