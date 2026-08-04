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
import { getChildDisplayName } from '../utils/personName'
import { toProperCase } from '../utils/textFormatter'
import { getNextBaptismRecordParts } from '../utils/recordNumber'
import { normalizeRecordStatus } from '../constants/status'
import {
  getRequirementsSummary,
  normalizeSacramentRequirements,
} from '../constants/sacramentRequirements'
import { normalizeGender } from '../constants/gender'
import { syncSacramentalEvent } from './eventService'

/**
 * Firestore collection reference for baptism documents.
 * Collection is created automatically on the first successful write.
 */
export const baptismCollectionRef = collection(db, COLLECTIONS.BAPTISM)

/**
 * Baptism Firestore schema (document fields only).
 *
 * {
 *   recordNumber: number,
 *   recordYear: number,
 *   childFirstName: string,
 *   childMiddleName: string,
 *   childLastName: string,
 *   childSuffix: string,
 *   fatherFirstName: string,
 *   fatherMiddleName: string,
 *   fatherLastName: string,
 *   fatherSuffix: string,
 *   motherFirstName: string,
 *   motherMiddleName: string,
 *   motherLastName: string,
 *   motherSuffix: string,
 *   dateOfBirth: Timestamp | Date,
 *   gender: string,
 *   legitimacy: string,
 *   parentsResidence: string,
 *   godparents: Array<{ firstName, middleName, lastName, suffix, gender }>,
 *   minister: string,
 *   baptismDate: Timestamp | Date,
 *   time: string,
 *   remarks: string,
 *   status: 'active',
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp,
 * }
 */
export const BAPTISM_FIELDS = {
  RECORD_NUMBER: 'recordNumber',
  RECORD_YEAR: 'recordYear',
  CHILD_FIRST_NAME: 'childFirstName',
  CHILD_MIDDLE_NAME: 'childMiddleName',
  CHILD_LAST_NAME: 'childLastName',
  CHILD_SUFFIX: 'childSuffix',
  FATHER_FIRST_NAME: 'fatherFirstName',
  FATHER_MIDDLE_NAME: 'fatherMiddleName',
  FATHER_LAST_NAME: 'fatherLastName',
  FATHER_SUFFIX: 'fatherSuffix',
  MOTHER_FIRST_NAME: 'motherFirstName',
  MOTHER_MIDDLE_NAME: 'motherMiddleName',
  MOTHER_LAST_NAME: 'motherLastName',
  MOTHER_SUFFIX: 'motherSuffix',
  DATE_OF_BIRTH: 'dateOfBirth',
  GENDER: 'gender',
  LEGITIMACY: 'legitimacy',
  PARENTS_RESIDENCE: 'parentsResidence',
  GODPARENTS: 'godparents',
  MINISTER: 'minister',
  BAPTISM_DATE: 'baptismDate',
  TIME: 'time',
  REMARKS: 'remarks',
  STATUS: 'status',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
}

const REQUIRED_FIELDS = [
  BAPTISM_FIELDS.CHILD_FIRST_NAME,
  BAPTISM_FIELDS.CHILD_LAST_NAME,
  BAPTISM_FIELDS.DATE_OF_BIRTH,
  BAPTISM_FIELDS.GENDER,
  BAPTISM_FIELDS.BAPTISM_DATE,
  BAPTISM_FIELDS.FATHER_FIRST_NAME,
  BAPTISM_FIELDS.FATHER_LAST_NAME,
  BAPTISM_FIELDS.MOTHER_FIRST_NAME,
  BAPTISM_FIELDS.MOTHER_LAST_NAME,
  BAPTISM_FIELDS.PARENTS_RESIDENCE,
  BAPTISM_FIELDS.MINISTER,
  'placeOfBirth',
]

function normalizeText(value) {
  return String(value ?? '').trim()
}

/**
 * Normalizes an optional HH:mm time string for sacramental records.
 * Empty values stay empty so older documents remain valid.
 *
 * @param {unknown} value
 * @returns {string}
 */
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
    legitimacy: data.legitimacy ?? data.legitimacyStatus ?? '',
    gender: normalizeGender(data.gender),
    recordType: normalizeRecordType(data.recordType),
    requirements: normalizeSacramentRequirements('baptism', data.requirements),
  }
}

function normalizeGodparents(godparents) {
  if (!Array.isArray(godparents)) return []

  return godparents
    .map((item) => {
      if (!item || typeof item !== 'object') return null

      const firstName = toProperCase(item.firstName)
      const middleName = toProperCase(item.middleName)
      const lastName = toProperCase(item.lastName)
      const suffix = toProperCase(item.suffix)
      const gender = normalizeGender(item.gender)

      if (!firstName && !middleName && !lastName && !suffix && !gender) {
        return null
      }

      return { firstName, middleName, lastName, suffix, gender }
    })
    .filter(Boolean)
}

function validateBaptismPayload(data) {
  if (!data || typeof data !== 'object') {
    throw new Error(MESSAGES.ERROR.BAPTISM_CREATE_VALIDATION)
  }

  const missing = REQUIRED_FIELDS.filter((field) => {
    const value = data[field]
    if (value === null || value === undefined) return true
    if (typeof value === 'string' && !value.trim()) return true
    return false
  })

  if (missing.length > 0) {
    throw new Error(MESSAGES.ERROR.BAPTISM_REQUIRED_FIELDS)
  }

  const dateOfBirth = normalizeDateValue(data.dateOfBirth)
  const baptismDate = normalizeDateValue(data.baptismDate)

  if (!dateOfBirth || !baptismDate) {
    throw new Error(MESSAGES.ERROR.BAPTISM_REQUIRED_FIELDS)
  }

  if (dateOfBirth > baptismDate) {
    throw new Error('Birth date cannot be after baptism date.')
  }
}

/**
 * Builds a Firestore document using ONLY the new baptism schema.
 *
 * @param {object} data
 * @returns {object}
 */
export function buildBaptismDocument(data = {}) {
  const normalized = normalizeIncomingPayload(data)

  return {
    recordNumber: Number(normalized.recordNumber),
    recordYear: Number(normalized.recordYear),
    recordType: normalizeRecordType(normalized.recordType),
    childFirstName: toProperCase(normalized.childFirstName),
    childMiddleName: toProperCase(normalized.childMiddleName),
    childLastName: toProperCase(normalized.childLastName),
    childSuffix: toProperCase(normalized.childSuffix),
    fatherFirstName: toProperCase(normalized.fatherFirstName),
    fatherMiddleName: toProperCase(normalized.fatherMiddleName),
    fatherLastName: toProperCase(normalized.fatherLastName),
    fatherSuffix: toProperCase(normalized.fatherSuffix),
    motherFirstName: toProperCase(normalized.motherFirstName),
    motherMiddleName: toProperCase(normalized.motherMiddleName),
    motherLastName: toProperCase(normalized.motherLastName),
    motherSuffix: toProperCase(normalized.motherSuffix),
    dateOfBirth: normalizeDateValue(normalized.dateOfBirth),
    gender: normalizeGender(normalized.gender),
    legitimacy: normalizeText(normalized.legitimacy),
    placeOfBirth: normalizeText(normalized.placeOfBirth),
    placeOfBirthPlace: normalized.placeOfBirthPlace || null,
    parentsResidence: normalizeText(normalized.parentsResidence),
    parentsResidencePlace: normalized.parentsResidencePlace || null,
    godparents: normalizeGodparents(normalized.godparents),
    minister: toProperCase(normalized.minister),
    baptismDate: normalizeDateValue(normalized.baptismDate),
    time: normalizeTimeValue(normalized.time),
    remarks: normalizeText(normalized.remarks),
    notes: normalizeText(normalized.notes),
    requirements: normalizeSacramentRequirements(
      'baptism',
      normalized.requirements,
    ),
    requirementsStatus: getRequirementsSummary(
      'baptism',
      normalized.requirements,
    ).status,
    status: normalizeRecordStatus(normalized.status || STATUS.SCHEDULED),
    createdBy: normalizeText(normalized.createdBy),
    updatedBy: normalizeText(normalized.updatedBy),
  }
}

/**
 * Maps a Firestore baptism document to UI-friendly field aliases
 * without changing the Add/Edit form structure.
 *
 * @param {object} docData
 * @returns {object}
 */
export function mapBaptismDocToUi(docData = {}) {
  const requirements = normalizeSacramentRequirements(
    'baptism',
    docData.requirements,
  )
  const summary = getRequirementsSummary('baptism', requirements)

  return {
    ...docData,
    // UI still binds to birthDate / legitimacyStatus
    birthDate: docData.dateOfBirth ?? null,
    legitimacyStatus: docData.legitimacy ?? '',
    requirements,
    requirementsStatus: summary.status,
  }
}

/**
 * Fetch baptism records without composite indexes.
 * Loads the collection, then sorts by recordYear + recordNumber in memory.
 *
 * @returns {Promise<object[]>}
 */
export async function getBaptismRecords() {
  try {
    // Avoid orderBy(year)+orderBy(number) — that combo needs a composite index.
    const snapshot = await getDocs(baptismCollectionRef)

    return snapshot.docs
      .map((docSnap) => {
        const data = docSnap.data()
        return mapBaptismDocToUi({
          id: docSnap.id,
          ...data,
          status: normalizeRecordStatus(data.status),
        })
      })
      .sort((a, b) => {
        const yearDiff = Number(a.recordYear || 0) - Number(b.recordYear || 0)
        if (yearDiff !== 0) return yearDiff
        return Number(a.recordNumber || 0) - Number(b.recordNumber || 0)
      })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : MESSAGES.ERROR.UNKNOWN
    throw new Error(`${MESSAGES.ERROR.BAPTISM_FETCH} ${message}`)
  }
}

/**
 * Fetch a single baptism record by document id.
 *
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getBaptismRecord(id) {
  try {
    if (!id) {
      throw new Error('Baptism record id is required.')
    }

    const snapshot = await getDoc(doc(db, COLLECTIONS.BAPTISM, id))
    if (!snapshot.exists()) return null

    return mapBaptismDocToUi({
      id: snapshot.id,
      ...snapshot.data(),
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : MESSAGES.ERROR.UNKNOWN
    throw new Error(`${MESSAGES.ERROR.BAPTISM_FETCH} ${message}`)
  }
}

/**
 * Checks whether a recordYear + recordNumber combination already exists.
 *
 * @param {number} recordYear
 * @param {number} recordNumber
 * @param {string} [excludeId]
 * @returns {Promise<boolean>}
 */
/**
 * Duplicate check without composite where() indexes.
 * Uses the same collection scan pattern as getBaptismRecords().
 */
async function isRecordNumberTaken(recordYear, recordNumber, excludeId) {
  const year = Number(recordYear)
  const number = Number(recordNumber)
  const snapshot = await getDocs(baptismCollectionRef)

  return snapshot.docs.some((docSnap) => {
    if (excludeId && docSnap.id === excludeId) return false
    const data = docSnap.data() || {}
    return (
      Number(data.recordYear) === year && Number(data.recordNumber) === number
    )
  })
}

function buildBaptismEventPayload(recordId, record) {
  const childName = getChildDisplayName(record)
  const titleName = childName && childName !== '—' ? childName : 'Baptism'
  const time = normalizeTimeValue(record.time) || '08:00'

  return {
    source: EVENT_SOURCES.BAPTISM,
    relatedRecordId: recordId,
    title: `Baptism - ${titleName}`,
    date: record.baptismDate,
    time,
    description: record.remarks || '',
  }
}

/**
 * Create a new baptism record in Firestore.
 * The `baptism` collection is created automatically on first write.
 * Also syncs a linked calendar event.
 *
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function createBaptismRecord(data, options = {}) {
  try {
    const normalized = normalizeIncomingPayload(data)
    validateBaptismPayload(normalized)

    const recordType = normalizeRecordType(normalized.recordType)

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

      const taken = await isRecordNumberTaken(
        normalized.recordYear,
        normalized.recordNumber,
      )
      if (taken) {
        throw new Error(MESSAGES.ERROR.BAPTISM_DUPLICATE_RECORD)
      }
    } else {
      // Calendar / new records — auto-number for the current calendar year.
      const currentYear = new Date().getFullYear()
      const existing = await getBaptismRecords()
      const next = getNextBaptismRecordParts(existing, currentYear)
      normalized.recordYear = next.recordYear
      normalized.recordNumber = next.recordNumber

      // Reuse the already-fetched collection instead of a second full scan.
      const taken = existing.some(
        (item) =>
          Number(item.recordYear) === Number(normalized.recordYear) &&
          Number(item.recordNumber) === Number(normalized.recordNumber),
      )
      if (taken) {
        throw new Error(MESSAGES.ERROR.BAPTISM_DUPLICATE_RECORD)
      }
    }

    normalized.recordType = recordType

    const actor =
      options.userEmail ||
      options.user?.email ||
      options.createdBy ||
      ''

    const payload = {
      ...buildBaptismDocument({
        ...normalized,
        status: STATUS.SCHEDULED,
        createdBy: actor,
        updatedBy: actor,
      }),
      status: STATUS.SCHEDULED,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(baptismCollectionRef, payload)

    try {
      await syncSacramentalEvent(buildBaptismEventPayload(docRef.id, payload))
    } catch (syncError) {
      console.error('Failed to sync baptism calendar event:', syncError)
    }

    return mapBaptismDocToUi({
      id: docRef.id,
      ...payload,
    })
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === MESSAGES.ERROR.BAPTISM_REQUIRED_FIELDS ||
        error.message === MESSAGES.ERROR.BAPTISM_CREATE_VALIDATION ||
        error.message === MESSAGES.ERROR.BAPTISM_DUPLICATE_RECORD ||
        error.message.includes('Birth date') ||
        error.message.includes('Record number') ||
        error.message.includes('Record year'))
    ) {
      throw error
    }

    const message =
      error instanceof Error ? error.message : MESSAGES.ERROR.UNKNOWN
    throw new Error(`${MESSAGES.ERROR.BAPTISM_CREATE} ${message}`)
  }
}

/**
 * Update an existing baptism record using the new schema.
 * Also updates the linked calendar event.
 *
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function updateBaptismRecord(id, data, options = {}) {
  try {
    if (!id) {
      throw new Error('Baptism record id is required.')
    }

    const normalized = normalizeIncomingPayload(data)
    validateBaptismPayload(normalized)

    const recordYear = Number(normalized.recordYear)
    const recordNumber = Number(normalized.recordNumber)

    if (!Number.isInteger(recordYear) || !Number.isInteger(recordNumber)) {
      throw new Error(MESSAGES.ERROR.BAPTISM_REQUIRED_FIELDS)
    }

    const taken = await isRecordNumberTaken(recordYear, recordNumber, id)
    if (taken) {
      throw new Error(MESSAGES.ERROR.BAPTISM_DUPLICATE_RECORD)
    }

    const actor =
      options.userEmail ||
      options.user?.email ||
      options.updatedBy ||
      normalized.updatedBy ||
      ''

    const payload = {
      ...buildBaptismDocument({
        ...normalized,
        status: data.status || normalized.status,
        updatedBy: actor,
      }),
      updatedAt: serverTimestamp(),
    }

    // Do not overwrite createdBy on update
    delete payload.createdBy

    const docRef = doc(db, COLLECTIONS.BAPTISM, id)
    await updateDoc(docRef, payload)

    try {
      await syncSacramentalEvent(buildBaptismEventPayload(id, payload))
    } catch (syncError) {
      console.error('Failed to sync baptism calendar event:', syncError)
    }

    return mapBaptismDocToUi({
      id,
      ...payload,
    })
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === MESSAGES.ERROR.BAPTISM_REQUIRED_FIELDS ||
        error.message === MESSAGES.ERROR.BAPTISM_CREATE_VALIDATION ||
        error.message === MESSAGES.ERROR.BAPTISM_DUPLICATE_RECORD ||
        error.message.includes('Birth date') ||
        error.message.includes('Record number') ||
        error.message.includes('Record year') ||
        error.message.includes('id is required'))
    ) {
      throw error
    }

    const message =
      error instanceof Error ? error.message : MESSAGES.ERROR.UNKNOWN
    throw new Error(`${MESSAGES.ERROR.BAPTISM_UPDATE} ${message}`)
  }
}
