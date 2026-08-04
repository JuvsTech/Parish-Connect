import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import {
  COLLECTIONS,
  EVENT_SOURCES,
  MESSAGES,
  STATUS,
} from '../constants'
import { toLocalDate } from '../utils/date'
import {
  getConfirmandDisplayName,
  resolveFemaleSponsorNameParts,
  resolveMaleSponsorNameParts,
} from '../utils/personName'
import { getNextConfirmationRecordParts } from '../utils/recordNumber'
import { toProperCase } from '../utils/textFormatter'
import {
  getRequirementsSummary,
  normalizeSacramentRequirements,
} from '../constants/sacramentRequirements'
import { normalizeGender } from '../constants/gender'
import { syncSacramentalEvent } from './eventService'

/**
 * Firestore collection reference for confirmation documents.
 * Collection is created automatically on the first successful write.
 */
export const confirmationCollectionRef = collection(
  db,
  COLLECTIONS.CONFIRMATION,
)

/**
 * Confirmation Firestore schema (document fields only).
 *
 * {
 *   recordNumber: number,
 *   recordYear: number,
 *   recordType: 'new' | 'old',
 *   confirmandFirstName: string,
 *   confirmandMiddleName: string,
 *   confirmandLastName: string,
 *   confirmandSuffix: string,
 *   gender: string,
 *   dateOfBirth: Timestamp | Date,
 *   age: number,
 *   placeOfBaptism: string,
 *   fatherFirstName: string,
 *   fatherMiddleName: string,
 *   fatherLastName: string,
 *   fatherSuffix: string,
 *   motherFirstName: string,
 *   motherMiddleName: string,
 *   motherLastName: string,
 *   motherSuffix: string,
 *   maleSponsorFirstName: string,
 *   maleSponsorMiddleName: string,
 *   maleSponsorLastName: string,
 *   maleSponsorSuffix: string,
 *   femaleSponsorFirstName: string,
 *   femaleSponsorMiddleName: string,
 *   femaleSponsorLastName: string,
 *   femaleSponsorSuffix: string,
 *   minister: string,
 *   confirmationDate: Timestamp | Date,
 *   time: string,
 *   remarks: string,
 *   status: 'active',
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp,
 * }
 */
export const CONFIRMATION_FIELDS = {
  RECORD_NUMBER: 'recordNumber',
  RECORD_YEAR: 'recordYear',
  RECORD_TYPE: 'recordType',
  CONFIRMAND_FIRST_NAME: 'confirmandFirstName',
  CONFIRMAND_MIDDLE_NAME: 'confirmandMiddleName',
  CONFIRMAND_LAST_NAME: 'confirmandLastName',
  CONFIRMAND_SUFFIX: 'confirmandSuffix',
  GENDER: 'gender',
  DATE_OF_BIRTH: 'dateOfBirth',
  AGE: 'age',
  PLACE_OF_BAPTISM: 'placeOfBaptism',
  FATHER_FIRST_NAME: 'fatherFirstName',
  FATHER_MIDDLE_NAME: 'fatherMiddleName',
  FATHER_LAST_NAME: 'fatherLastName',
  FATHER_SUFFIX: 'fatherSuffix',
  MOTHER_FIRST_NAME: 'motherFirstName',
  MOTHER_MIDDLE_NAME: 'motherMiddleName',
  MOTHER_LAST_NAME: 'motherLastName',
  MOTHER_SUFFIX: 'motherSuffix',
  MALE_SPONSOR_FIRST_NAME: 'maleSponsorFirstName',
  MALE_SPONSOR_MIDDLE_NAME: 'maleSponsorMiddleName',
  MALE_SPONSOR_LAST_NAME: 'maleSponsorLastName',
  MALE_SPONSOR_SUFFIX: 'maleSponsorSuffix',
  FEMALE_SPONSOR_FIRST_NAME: 'femaleSponsorFirstName',
  FEMALE_SPONSOR_MIDDLE_NAME: 'femaleSponsorMiddleName',
  FEMALE_SPONSOR_LAST_NAME: 'femaleSponsorLastName',
  FEMALE_SPONSOR_SUFFIX: 'femaleSponsorSuffix',
  MINISTER: 'minister',
  CONFIRMATION_DATE: 'confirmationDate',
  TIME: 'time',
  REMARKS: 'remarks',
  STATUS: 'status',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
}

const REQUIRED_FIELDS = [
  CONFIRMATION_FIELDS.RECORD_NUMBER,
  CONFIRMATION_FIELDS.RECORD_YEAR,
  CONFIRMATION_FIELDS.CONFIRMAND_FIRST_NAME,
  CONFIRMATION_FIELDS.CONFIRMAND_LAST_NAME,
  CONFIRMATION_FIELDS.GENDER,
  CONFIRMATION_FIELDS.DATE_OF_BIRTH,
  CONFIRMATION_FIELDS.AGE,
  CONFIRMATION_FIELDS.PLACE_OF_BAPTISM,
  CONFIRMATION_FIELDS.FATHER_FIRST_NAME,
  CONFIRMATION_FIELDS.FATHER_LAST_NAME,
  CONFIRMATION_FIELDS.MOTHER_FIRST_NAME,
  CONFIRMATION_FIELDS.MOTHER_LAST_NAME,
  CONFIRMATION_FIELDS.MALE_SPONSOR_FIRST_NAME,
  CONFIRMATION_FIELDS.MALE_SPONSOR_LAST_NAME,
  CONFIRMATION_FIELDS.FEMALE_SPONSOR_FIRST_NAME,
  CONFIRMATION_FIELDS.FEMALE_SPONSOR_LAST_NAME,
  CONFIRMATION_FIELDS.MINISTER,
  CONFIRMATION_FIELDS.CONFIRMATION_DATE,
]

function normalizeText(value) {
  return String(value ?? '').trim()
}

function normalizeTimeValue(value) {
  const raw = normalizeText(value)
  if (!raw) return ''

  const match = raw.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return raw

  const hours = String(Math.min(23, Number(match[1]))).padStart(2, '0')
  const minutes = String(Math.min(59, Number(match[2]))).padStart(2, '0')
  return `${hours}:${minutes}`
}

function normalizeDateValue(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value?.toDate === 'function') return value.toDate()
  if (typeof value === 'string') return toLocalDate(value)
  return null
}

function normalizeRecordType(value) {
  return value === 'old' ? 'old' : 'new'
}

/**
 * Accepts UI payload field aliases and normalizes to Firestore schema keys.
 */
function normalizeIncomingPayload(data = {}) {
  return {
    ...data,
    dateOfBirth: data.dateOfBirth ?? data.birthDate ?? null,
    gender: normalizeGender(data.gender),
    recordType: normalizeRecordType(data.recordType),
    age: data.age,
    requirements: normalizeSacramentRequirements(
      'confirmation',
      data.requirements,
    ),
  }
}

function validateConfirmationPayload(data) {
  if (!data || typeof data !== 'object') {
    throw new Error(MESSAGES.ERROR.CONFIRMATION_CREATE_VALIDATION)
  }

  const missing = REQUIRED_FIELDS.filter((field) => {
    const value = data[field]
    if (value === null || value === undefined) return true
    if (typeof value === 'string' && !value.trim()) return true
    return false
  })

  if (missing.length > 0) {
    throw new Error(MESSAGES.ERROR.CONFIRMATION_REQUIRED_FIELDS)
  }

  const recordNumber = Number(data.recordNumber)
  const recordYear = Number(data.recordYear)
  const age = Number(data.age)

  if (!Number.isInteger(recordNumber) || recordNumber < 1) {
    throw new Error('Record number must be a positive integer.')
  }

  if (!Number.isInteger(recordYear) || recordYear < 1000) {
    throw new Error('Record year must be a valid year.')
  }

  if (!Number.isInteger(age) || age < 13) {
    throw new Error(
      'The candidate must be at least 13 years old to receive the Sacrament of Confirmation.',
    )
  }

  const dateOfBirth = normalizeDateValue(data.dateOfBirth)
  const confirmationDate = normalizeDateValue(data.confirmationDate)

  if (!dateOfBirth || !confirmationDate) {
    throw new Error(MESSAGES.ERROR.CONFIRMATION_REQUIRED_FIELDS)
  }

  if (dateOfBirth > confirmationDate) {
    throw new Error('Birth date cannot be after confirmation date.')
  }
}

/**
 * Builds a Firestore document using the confirmation registry schema.
 *
 * @param {object} data
 * @returns {object}
 */
export function buildConfirmationDocument(data = {}) {
  const normalized = normalizeIncomingPayload(data)

  return {
    recordNumber: Number(normalized.recordNumber),
    recordYear: Number(normalized.recordYear),
    recordType: normalizeRecordType(normalized.recordType),
    confirmandFirstName: toProperCase(normalized.confirmandFirstName),
    confirmandMiddleName: toProperCase(normalized.confirmandMiddleName),
    confirmandLastName: toProperCase(normalized.confirmandLastName),
    confirmandSuffix: toProperCase(normalized.confirmandSuffix),
    gender: normalizeGender(normalized.gender),
    dateOfBirth: normalizeDateValue(normalized.dateOfBirth),
    age: Number(normalized.age),
    placeOfBaptism: normalizeText(
      normalized.placeOfBaptism || normalized.placeOfBirth,
    ),
    fatherFirstName: toProperCase(normalized.fatherFirstName),
    fatherMiddleName: toProperCase(normalized.fatherMiddleName),
    fatherLastName: toProperCase(normalized.fatherLastName),
    fatherSuffix: toProperCase(normalized.fatherSuffix),
    motherFirstName: toProperCase(normalized.motherFirstName),
    motherMiddleName: toProperCase(normalized.motherMiddleName),
    motherLastName: toProperCase(normalized.motherLastName),
    motherSuffix: toProperCase(normalized.motherSuffix),
    maleSponsorFirstName: toProperCase(normalized.maleSponsorFirstName),
    maleSponsorMiddleName: toProperCase(normalized.maleSponsorMiddleName),
    maleSponsorLastName: toProperCase(normalized.maleSponsorLastName),
    maleSponsorSuffix: toProperCase(normalized.maleSponsorSuffix),
    femaleSponsorFirstName: toProperCase(normalized.femaleSponsorFirstName),
    femaleSponsorMiddleName: toProperCase(normalized.femaleSponsorMiddleName),
    femaleSponsorLastName: toProperCase(normalized.femaleSponsorLastName),
    femaleSponsorSuffix: toProperCase(normalized.femaleSponsorSuffix),
    // Clear legacy full-name / single-sponsor fields on write.
    maleSponsor: '',
    femaleSponsor: '',
    sponsorFirstName: '',
    sponsorMiddleName: '',
    sponsorLastName: '',
    sponsorSuffix: '',
    minister: toProperCase(normalized.minister),
    confirmationDate: normalizeDateValue(normalized.confirmationDate),
    time: normalizeTimeValue(normalized.time),
    remarks: normalizeText(normalized.remarks),
    requirements: normalizeSacramentRequirements(
      'confirmation',
      normalized.requirements,
    ),
    requirementsStatus: getRequirementsSummary(
      'confirmation',
      normalized.requirements,
    ).status,
    status: normalized.status || STATUS.ACTIVE,
  }
}

/**
 * Maps a Firestore confirmation document to UI-friendly field aliases.
 *
 * @param {object} docData
 * @returns {object}
 */
export function mapConfirmationDocToUi(docData = {}) {
  const requirements = normalizeSacramentRequirements(
    'confirmation',
    docData.requirements,
  )
  const summary = getRequirementsSummary('confirmation', requirements)

  const maleSponsor = resolveMaleSponsorNameParts(docData)
  const femaleSponsor = resolveFemaleSponsorNameParts(docData)

  return {
    ...docData,
    birthDate: docData.dateOfBirth ?? null,
    placeOfBaptism: docData.placeOfBaptism || docData.placeOfBirth || '',
    recordType: normalizeRecordType(docData.recordType),
    maleSponsorFirstName: maleSponsor.firstName,
    maleSponsorMiddleName: maleSponsor.middleName,
    maleSponsorLastName: maleSponsor.lastName,
    maleSponsorSuffix: maleSponsor.suffix,
    femaleSponsorFirstName: femaleSponsor.firstName,
    femaleSponsorMiddleName: femaleSponsor.middleName,
    femaleSponsorLastName: femaleSponsor.lastName,
    femaleSponsorSuffix: femaleSponsor.suffix,
    requirements,
    requirementsStatus: summary.status,
  }
}

/**
 * Fetch confirmation records without composite indexes.
 * Loads the collection, then sorts by recordYear + recordNumber in memory.
 *
 * @returns {Promise<object[]>}
 */
export async function getConfirmationRecords() {
  try {
    const snapshot = await getDocs(confirmationCollectionRef)

    return snapshot.docs
      .map((docSnap) =>
        mapConfirmationDocToUi({
          id: docSnap.id,
          ...docSnap.data(),
        }),
      )
      .sort((a, b) => {
        const yearDiff = Number(a.recordYear || 0) - Number(b.recordYear || 0)
        if (yearDiff !== 0) return yearDiff
        return Number(a.recordNumber || 0) - Number(b.recordNumber || 0)
      })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : MESSAGES.ERROR.UNKNOWN
    throw new Error(`${MESSAGES.ERROR.CONFIRMATION_FETCH} ${message}`)
  }
}

/**
 * Fetch a single confirmation record by document id.
 *
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getConfirmationRecordById(id) {
  try {
    if (!id) {
      throw new Error('Confirmation record id is required.')
    }

    const snapshot = await getDoc(doc(db, COLLECTIONS.CONFIRMATION, id))
    if (!snapshot.exists()) return null

    return mapConfirmationDocToUi({
      id: snapshot.id,
      ...snapshot.data(),
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : MESSAGES.ERROR.UNKNOWN
    throw new Error(`${MESSAGES.ERROR.CONFIRMATION_FETCH} ${message}`)
  }
}

async function isRecordNumberTaken(recordYear, recordNumber, excludeId) {
  const year = Number(recordYear)
  const number = Number(recordNumber)
  const snapshot = await getDocs(confirmationCollectionRef)

  return snapshot.docs.some((docSnap) => {
    if (excludeId && docSnap.id === excludeId) return false
    const data = docSnap.data() || {}
    return (
      Number(data.recordYear) === year && Number(data.recordNumber) === number
    )
  })
}

function buildConfirmationEventPayload(recordId, record) {
  const confirmandName = getConfirmandDisplayName(record)
  const titleName =
    confirmandName && confirmandName !== '—' ? confirmandName : 'Confirmation'
  const time = normalizeTimeValue(record.time) || '08:00'

  return {
    source: EVENT_SOURCES.CONFIRMATION,
    relatedRecordId: recordId,
    title: `Confirmation - ${titleName}`,
    date: record.confirmationDate,
    time,
    description: record.remarks || '',
  }
}

/**
 * Create a new confirmation record in Firestore.
 * Also syncs a linked calendar event.
 *
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function createConfirmationRecord(data) {
  try {
    const normalized = normalizeIncomingPayload(data)
    const recordType = normalizeRecordType(normalized.recordType)

    let existingForNumbering = null

    if (recordType === 'old') {
      // Historical registry encoding — use the registry values as entered.
      const recordYear = Number(normalized.recordYear)
      const recordNumber = Number(normalized.recordNumber)

      if (!Number.isInteger(recordYear) || recordYear < 1000) {
        throw new Error('Record year must be a valid year.')
      }
      if (!Number.isInteger(recordNumber) || recordNumber < 1) {
        throw new Error('Record number must be a positive integer.')
      }

      normalized.recordYear = recordYear
      normalized.recordNumber = recordNumber
    } else {
      // Calendar / new records — auto-number for the current calendar year.
      const currentYear = new Date().getFullYear()
      existingForNumbering = await getConfirmationRecords()
      const next = getNextConfirmationRecordParts(
        existingForNumbering,
        currentYear,
      )
      normalized.recordYear = next.recordYear
      normalized.recordNumber = next.recordNumber
    }

    normalized.recordType = recordType
    validateConfirmationPayload(normalized)

    const recordYear = Number(normalized.recordYear)
    const recordNumber = Number(normalized.recordNumber)

    const taken = existingForNumbering
      ? existingForNumbering.some(
          (item) =>
            Number(item.recordYear) === recordYear &&
            Number(item.recordNumber) === recordNumber,
        )
      : await isRecordNumberTaken(recordYear, recordNumber)
    if (taken) {
      throw new Error(MESSAGES.ERROR.CONFIRMATION_DUPLICATE_RECORD)
    }

    const payload = {
      ...buildConfirmationDocument(normalized),
      status: STATUS.ACTIVE,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(confirmationCollectionRef, payload)

    try {
      await syncSacramentalEvent(
        buildConfirmationEventPayload(docRef.id, payload),
      )
    } catch (syncError) {
      console.error('Failed to sync confirmation calendar event:', syncError)
    }

    return mapConfirmationDocToUi({
      id: docRef.id,
      ...payload,
    })
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === MESSAGES.ERROR.CONFIRMATION_REQUIRED_FIELDS ||
        error.message === MESSAGES.ERROR.CONFIRMATION_CREATE_VALIDATION ||
        error.message === MESSAGES.ERROR.CONFIRMATION_DUPLICATE_RECORD ||
        error.message.includes('Birth date') ||
        error.message.includes('Record number') ||
        error.message.includes('Record year') ||
        error.message.includes('Age must') ||
        error.message.includes('at least 13 years old'))
    ) {
      throw error
    }

    const message =
      error instanceof Error ? error.message : MESSAGES.ERROR.UNKNOWN
    throw new Error(`${MESSAGES.ERROR.CONFIRMATION_CREATE} ${message}`)
  }
}

/**
 * Update an existing confirmation record.
 * Also updates the linked calendar event.
 *
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function updateConfirmationRecord(id, data) {
  try {
    if (!id) {
      throw new Error('Confirmation record id is required.')
    }

    const normalized = normalizeIncomingPayload(data)
    validateConfirmationPayload(normalized)

    const recordYear = Number(normalized.recordYear)
    const recordNumber = Number(normalized.recordNumber)

    const taken = await isRecordNumberTaken(recordYear, recordNumber, id)
    if (taken) {
      throw new Error(MESSAGES.ERROR.CONFIRMATION_DUPLICATE_RECORD)
    }

    const payload = {
      ...buildConfirmationDocument(normalized),
      updatedAt: serverTimestamp(),
    }

    if (data.status) {
      payload.status = data.status
    } else {
      delete payload.status
    }

    const docRef = doc(db, COLLECTIONS.CONFIRMATION, id)
    await updateDoc(docRef, payload)

    try {
      await syncSacramentalEvent(buildConfirmationEventPayload(id, payload))
    } catch (syncError) {
      console.error('Failed to sync confirmation calendar event:', syncError)
    }

    return mapConfirmationDocToUi({
      id,
      ...payload,
    })
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === MESSAGES.ERROR.CONFIRMATION_REQUIRED_FIELDS ||
        error.message === MESSAGES.ERROR.CONFIRMATION_CREATE_VALIDATION ||
        error.message === MESSAGES.ERROR.CONFIRMATION_DUPLICATE_RECORD ||
        error.message.includes('Birth date') ||
        error.message.includes('Record number') ||
        error.message.includes('Record year') ||
        error.message.includes('Age must') ||
        error.message.includes('at least 13 years old') ||
        error.message.includes('id is required'))
    ) {
      throw error
    }

    const message =
      error instanceof Error ? error.message : MESSAGES.ERROR.UNKNOWN
    throw new Error(`${MESSAGES.ERROR.CONFIRMATION_UPDATE} ${message}`)
  }
}
