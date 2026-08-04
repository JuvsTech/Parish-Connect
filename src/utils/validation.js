/**
 * Shared form validation helpers for sacramental records.
 */

import { isRecordNumberDuplicate } from './recordNumber'

export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required.',
  INVALID_NAME: 'Please enter a valid name.',
  INVALID_RECORD_NUMBER: 'Record Number must be a positive integer.',
  INVALID_RECORD_YEAR: 'Enter a valid 4-digit year.',
  BIRTH_AFTER_BAPTISM: 'Birth Date cannot be later than Baptism Date.',
  NEW_RECORD_BAPTISM_DATE:
    "New Records only allow today's date or a future baptism date.",
  OLD_RECORD_BAPTISM_DATE:
    'Old Records are intended for historical entries only. Please select a past baptism date.',
  NEW_RECORD_CONFIRMATION_DATE:
    "New Records only allow today's date or a future confirmation date.",
  OLD_RECORD_CONFIRMATION_DATE:
    'Old Records are intended for historical entries only. Please select a past confirmation date.',
  NEW_RECORD_SACRAMENT_DATE:
    "New Records only allow today's date or a future sacrament date.",
  OLD_RECORD_SACRAMENT_DATE:
    'Old Records are intended for historical entries only. Please select a past sacrament date.',
  INVALID_AGE: 'Age must be a positive integer.',
  BURIAL_BEFORE_DEATH: 'Burial Date cannot be earlier than Date of Death.',
}

/**
 * Local calendar date key (yyyy-mm-dd), ignoring time.
 *
 * @param {Date} [date]
 * @returns {string}
 */
export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Validates baptism date against Add-mode record type rules.
 * Compares local calendar dates only (no time component).
 *
 * @param {string} baptismDateKey yyyy-mm-dd
 * @param {'new' | 'old' | null | undefined} recordTypeRule
 * @returns {string|undefined}
 */
export function validateBaptismDateForRecordType(baptismDateKey, recordTypeRule) {
  if (!baptismDateKey || !recordTypeRule) return undefined

  const todayKey = getLocalDateKey()

  if (recordTypeRule === 'new' && baptismDateKey < todayKey) {
    return VALIDATION_MESSAGES.NEW_RECORD_BAPTISM_DATE
  }

  if (recordTypeRule === 'old' && baptismDateKey >= todayKey) {
    return VALIDATION_MESSAGES.OLD_RECORD_BAPTISM_DATE
  }

  return undefined
}

/**
 * Validates confirmation date against Add-mode record type rules.
 * Compares local calendar dates only (no time component).
 *
 * @param {string} confirmationDateKey yyyy-mm-dd
 * @param {'new' | 'old' | null | undefined} recordTypeRule
 * @returns {string|undefined}
 */
export function validateConfirmationDateForRecordType(
  confirmationDateKey,
  recordTypeRule,
) {
  if (!confirmationDateKey || !recordTypeRule) return undefined

  const todayKey = getLocalDateKey()

  if (recordTypeRule === 'new' && confirmationDateKey < todayKey) {
    return VALIDATION_MESSAGES.NEW_RECORD_CONFIRMATION_DATE
  }

  if (recordTypeRule === 'old' && confirmationDateKey >= todayKey) {
    return VALIDATION_MESSAGES.OLD_RECORD_CONFIRMATION_DATE
  }

  return undefined
}

/**
 * Generic sacrament-date rule for Marriage / Death (and shared use).
 *
 * @param {string} dateKey yyyy-mm-dd
 * @param {'new' | 'old' | null | undefined} recordTypeRule
 * @returns {string|undefined}
 */
export function validateSacramentDateForRecordType(dateKey, recordTypeRule) {
  if (!dateKey || !recordTypeRule) return undefined

  const todayKey = getLocalDateKey()

  if (recordTypeRule === 'new' && dateKey < todayKey) {
    return VALIDATION_MESSAGES.NEW_RECORD_SACRAMENT_DATE
  }

  if (recordTypeRule === 'old' && dateKey >= todayKey) {
    return VALIDATION_MESSAGES.OLD_RECORD_SACRAMENT_DATE
  }

  return undefined
}

/**
 * Shared Record Number / Record Year validation for Old Record encoding.
 *
 * @param {object} form
 * @param {object[]} existingRecords
 * @param {string} [excludeId]
 * @param {string} [duplicateMessage]
 * @returns {Record<string, string>}
 */
export function validateManualRecordNumberFields(
  form,
  existingRecords = [],
  excludeId,
  duplicateMessage = 'A record with this year and number already exists.',
) {
  const errors = {}

  if (!String(form.recordYear ?? '').trim()) {
    errors.recordYear = VALIDATION_MESSAGES.REQUIRED
  } else if (!isValidFourDigitYear(form.recordYear)) {
    errors.recordYear = VALIDATION_MESSAGES.INVALID_RECORD_YEAR
  }

  if (!String(form.recordNumber ?? '').trim()) {
    errors.recordNumber = VALIDATION_MESSAGES.REQUIRED
  } else if (!isPositiveInteger(form.recordNumber)) {
    errors.recordNumber = VALIDATION_MESSAGES.INVALID_RECORD_NUMBER
  }

  if (
    isValidFourDigitYear(form.recordYear) &&
    isPositiveInteger(form.recordNumber) &&
    isRecordNumberDuplicate(
      existingRecords,
      Number(form.recordYear),
      Number(form.recordNumber),
      excludeId,
    )
  ) {
    errors.recordNumber = duplicateMessage
  }

  return errors
}

/**
 * Reusable person-name validator.
 * Allows letters (incl. accented), spaces, apostrophe, hyphen, and period.
 * Must include at least one letter.
 *
 * @param {string} value
 * @returns {boolean}
 */
export function validatePersonName(value) {
  const name = String(value ?? '').trim()
  if (!name) return false
  if (!/^[\p{L}\s'.-]+$/u.test(name)) return false
  if (!/\p{L}/u.test(name)) return false
  return true
}

/** @deprecated Prefer validatePersonName */
export const isValidPersonName = validatePersonName

/**
 * Validates a required person-name field.
 *
 * @param {string} value
 * @returns {string|undefined} error message
 */
export function validateRequiredName(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return VALIDATION_MESSAGES.REQUIRED
  if (!validatePersonName(trimmed)) return VALIDATION_MESSAGES.INVALID_NAME
  return undefined
}

/**
 * Validates an optional person-name field (empty allowed).
 *
 * @param {string} value
 * @returns {string|undefined} error message
 */
export function validateOptionalName(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return undefined
  if (!validatePersonName(trimmed)) return VALIDATION_MESSAGES.INVALID_NAME
  return undefined
}

/**
 * Positive integer only (no decimals, no negatives).
 *
 * @param {string|number} value
 * @returns {boolean}
 */
export function isPositiveInteger(value) {
  const raw = String(value ?? '').trim()
  if (!/^\d+$/.test(raw)) return false
  const number = Number(raw)
  return Number.isInteger(number) && number >= 1
}

/**
 * Valid 4-digit year (numeric only).
 *
 * @param {string|number} value
 * @returns {boolean}
 */
export function isValidFourDigitYear(value) {
  const raw = String(value ?? '').trim()
  if (!/^\d{4}$/.test(raw)) return false
  const year = Number(raw)
  return Number.isInteger(year) && year >= 1000 && year <= 9999
}

/**
 * Phone: required, exactly 11 digits.
 * @returns {string} error message or ''
 */
export function getPhoneValidationError(value) {
  const raw = String(value ?? '').trim()
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!raw) return 'Phone number is required.'
  if (!/^\d{11}$/.test(digits) || raw !== digits) {
    return 'Phone number must be exactly 11 digits.'
  }
  return ''
}

/**
 * Optional email: empty is allowed; otherwise a basic valid email format.
 * @returns {string} error message or ''
 */
export function getEmailValidationError(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  // Practical email pattern (not full RFC)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
    return 'Please enter a valid email address.'
  }
  return ''
}
