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
} from '../constants'
import { toLocalDate } from '../utils/date'
import { getDeceasedDisplayName } from '../utils/personName'
import { getNextDeathRecordParts } from '../utils/recordNumber'
import { toProperCase } from '../utils/textFormatter'
import {
  getRequirementsSummary,
  normalizeSacramentRequirements,
} from '../constants/sacramentRequirements'
import { normalizeGender } from '../constants/gender'
import { syncSacramentalEvent } from './eventService'

/**
 * Firestore collection reference for death documents.
 * Collection is created automatically on the first successful write.
 */
export const deathCollectionRef = collection(db, COLLECTIONS.DEATH)

/**
 * Death Firestore schema (document fields only).
 *
 * {
 *   recordNumber: number,
 *   recordYear: number,
 *   recordType: 'new' | 'old',
 *   minister: string,
 *   dateOfDeath: Timestamp | Date,
 *   time: string,
 *   firstName: string,
 *   middleName: string,
 *   lastName: string,
 *   suffix: string,
 *   gender: string,
 *   dateOfBirth: Timestamp | Date,
 *   age: number,
 *   status: string,
 *   relationship: string,
 *   relatedPersonFirstName: string,
 *   relatedPersonMiddleName: string,
 *   relatedPersonLastName: string,
 *   relatedPersonSuffix: string,
 *   barangay: string,
 *   municipality: string,
 *   province: string,
 *   burialDate: Timestamp | Date,
 *   placeOfBurial: string,
 *   receivedLastSacraments: string,
 *   sickness: string,
 *   remarks: string,
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp,
 *   createdBy: string,
 *   updatedBy: string,
 * }
 */
export const DEATH_FIELDS = {
  RECORD_NUMBER: 'recordNumber',
  RECORD_YEAR: 'recordYear',
  RECORD_TYPE: 'recordType',
  MINISTER: 'minister',
  DATE_OF_DEATH: 'dateOfDeath',
  TIME: 'time',
  FIRST_NAME: 'firstName',
  MIDDLE_NAME: 'middleName',
  LAST_NAME: 'lastName',
  SUFFIX: 'suffix',
  GENDER: 'gender',
  DATE_OF_BIRTH: 'dateOfBirth',
  AGE: 'age',
  STATUS: 'status',
  RELATIONSHIP: 'relationship',
  RELATED_PERSON_FIRST_NAME: 'relatedPersonFirstName',
  RELATED_PERSON_MIDDLE_NAME: 'relatedPersonMiddleName',
  RELATED_PERSON_LAST_NAME: 'relatedPersonLastName',
  RELATED_PERSON_SUFFIX: 'relatedPersonSuffix',
  BARANGAY: 'barangay',
  MUNICIPALITY: 'municipality',
  PROVINCE: 'province',
  BURIAL_DATE: 'burialDate',
  PLACE_OF_BURIAL: 'placeOfBurial',
  RECEIVED_LAST_SACRAMENTS: 'receivedLastSacraments',
  SICKNESS: 'sickness',
  REMARKS: 'remarks',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  CREATED_BY: 'createdBy',
  UPDATED_BY: 'updatedBy',
}

const REQUIRED_FIELDS = [
  DEATH_FIELDS.RECORD_NUMBER,
  DEATH_FIELDS.RECORD_YEAR,
  DEATH_FIELDS.FIRST_NAME,
  DEATH_FIELDS.LAST_NAME,
  DEATH_FIELDS.GENDER,
  DEATH_FIELDS.DATE_OF_BIRTH,
  DEATH_FIELDS.AGE,
  DEATH_FIELDS.STATUS,
  DEATH_FIELDS.RELATIONSHIP,
  DEATH_FIELDS.RELATED_PERSON_FIRST_NAME,
  DEATH_FIELDS.RELATED_PERSON_LAST_NAME,
  DEATH_FIELDS.BARANGAY,
  DEATH_FIELDS.MUNICIPALITY,
  DEATH_FIELDS.PROVINCE,
  DEATH_FIELDS.MINISTER,
  DEATH_FIELDS.DATE_OF_DEATH,
  DEATH_FIELDS.BURIAL_DATE,
  DEATH_FIELDS.PLACE_OF_BURIAL,
  DEATH_FIELDS.RECEIVED_LAST_SACRAMENTS,
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
  if (value === 'old' || value === 'Old Record') return 'old'
  return 'new'
}

/**
 * Accepts UI payload field aliases and normalizes to Firestore schema keys.
 */
function normalizeIncomingPayload(data = {}) {
  return {
    ...data,
    firstName: data.firstName ?? data.deceasedFirstName ?? '',
    middleName: data.middleName ?? data.deceasedMiddleName ?? '',
    lastName: data.lastName ?? data.deceasedLastName ?? '',
    suffix: data.suffix ?? data.deceasedSuffix ?? '',
    status: data.status ?? data.civilStatus ?? '',
    minister: data.minister ?? data.officiatingMinister ?? '',
    gender: normalizeGender(data.gender),
    dateOfBirth: data.dateOfBirth ?? data.birthDate ?? null,
    recordType: normalizeRecordType(data.recordType),
    age: data.age,
    requirements: normalizeSacramentRequirements('death', data.requirements),
  }
}

function validateDeathPayload(data) {
  if (!data || typeof data !== 'object') {
    throw new Error(MESSAGES.ERROR.DEATH_CREATE_VALIDATION)
  }

  const missing = REQUIRED_FIELDS.filter((field) => {
    const value = data[field]
    if (value === null || value === undefined) return true
    if (typeof value === 'string' && !value.trim()) return true
    return false
  })

  if (missing.length > 0) {
    throw new Error(MESSAGES.ERROR.DEATH_REQUIRED_FIELDS)
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

  if (!Number.isInteger(age) || age < 0) {
    throw new Error('Age must be a valid number.')
  }

  const dateOfBirth = normalizeDateValue(data.dateOfBirth)
  const dateOfDeath = normalizeDateValue(data.dateOfDeath)
  const burialDate = normalizeDateValue(data.burialDate)

  if (!dateOfBirth || !dateOfDeath || !burialDate) {
    throw new Error(MESSAGES.ERROR.DEATH_REQUIRED_FIELDS)
  }

  if (dateOfBirth > dateOfDeath) {
    throw new Error('Date of Birth cannot be later than Date of Death.')
  }

  if (burialDate < dateOfDeath) {
    throw new Error('Burial Date cannot be earlier than Date of Death.')
  }
}

/**
 * Builds a Firestore document using the death registry schema.
 *
 * @param {object} data
 * @returns {object}
 */
export function buildDeathDocument(data = {}) {
  const normalized = normalizeIncomingPayload(data)

  return {
    recordNumber: Number(normalized.recordNumber),
    recordYear: Number(normalized.recordYear),
    recordType: normalizeRecordType(normalized.recordType),
    minister: toProperCase(normalized.minister),
    dateOfDeath: normalizeDateValue(normalized.dateOfDeath),
    time: normalizeTimeValue(normalized.time),
    firstName: toProperCase(normalized.firstName),
    middleName: toProperCase(normalized.middleName),
    lastName: toProperCase(normalized.lastName),
    suffix: toProperCase(normalized.suffix),
    gender: normalizeGender(normalized.gender),
    dateOfBirth: normalizeDateValue(normalized.dateOfBirth),
    age: Number(normalized.age),
    status: normalizeText(normalized.status),
    relationship: normalizeText(normalized.relationship),
    relatedPersonFirstName: toProperCase(normalized.relatedPersonFirstName),
    relatedPersonMiddleName: toProperCase(normalized.relatedPersonMiddleName),
    relatedPersonLastName: toProperCase(normalized.relatedPersonLastName),
    relatedPersonSuffix: toProperCase(normalized.relatedPersonSuffix),
    barangay: normalizeText(normalized.barangay),
    municipality: normalizeText(normalized.municipality),
    province: normalizeText(normalized.province),
    burialDate: normalizeDateValue(normalized.burialDate),
    placeOfBurial: normalizeText(normalized.placeOfBurial),
    receivedLastSacraments: normalizeText(normalized.receivedLastSacraments),
    sickness: normalizeText(normalized.sickness),
    remarks: normalizeText(normalized.remarks),
    requirements: normalizeSacramentRequirements(
      'death',
      normalized.requirements,
    ),
    requirementsStatus: getRequirementsSummary(
      'death',
      normalized.requirements,
    ).status,
    createdBy: normalizeText(normalized.createdBy),
    updatedBy: normalizeText(normalized.updatedBy),
  }
}

/**
 * Maps a Firestore death document to UI-friendly field aliases.
 *
 * @param {object} docData
 * @returns {object}
 */
export function mapDeathDocToUi(docData = {}) {
  const requirements = normalizeSacramentRequirements(
    'death',
    docData.requirements,
  )
  const summary = getRequirementsSummary('death', requirements)

  return {
    ...docData,
    recordType: normalizeRecordType(docData.recordType),
    firstName: docData.firstName || docData.deceasedFirstName || '',
    middleName: docData.middleName || docData.deceasedMiddleName || '',
    lastName: docData.lastName || docData.deceasedLastName || '',
    suffix: docData.suffix || docData.deceasedSuffix || '',
    status: docData.status || docData.civilStatus || '',
    minister: docData.minister || docData.officiatingMinister || '',
    birthDate: docData.dateOfBirth ?? docData.birthDate ?? null,
    requirements,
    requirementsStatus: summary.status,
  }
}

/**
 * Fetch death records without composite indexes.
 * Loads the collection, then sorts newest year/number first in memory.
 *
 * @returns {Promise<object[]>}
 */
export async function getDeathRecords() {
  try {
    const snapshot = await getDocs(deathCollectionRef)

    return snapshot.docs
      .map((docSnap) =>
        mapDeathDocToUi({
          id: docSnap.id,
          ...docSnap.data(),
        }),
      )
      .sort((a, b) => {
        const yearDiff = Number(b.recordYear || 0) - Number(a.recordYear || 0)
        if (yearDiff !== 0) return yearDiff
        return Number(b.recordNumber || 0) - Number(a.recordNumber || 0)
      })
  } catch {
    throw new Error(MESSAGES.ERROR.DEATH_FETCH)
  }
}

/**
 * Fetch a single death record by document id.
 *
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getDeathRecordById(id) {
  try {
    if (!id) {
      throw new Error(MESSAGES.ERROR.DEATH_REQUIRED_FIELDS)
    }

    const snapshot = await getDoc(doc(db, COLLECTIONS.DEATH, id))
    if (!snapshot.exists()) return null

    return mapDeathDocToUi({
      id: snapshot.id,
      ...snapshot.data(),
    })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === MESSAGES.ERROR.DEATH_REQUIRED_FIELDS
    ) {
      throw error
    }
    throw new Error(MESSAGES.ERROR.DEATH_FETCH)
  }
}

async function isRecordNumberTaken(recordYear, recordNumber, excludeId) {
  const year = Number(recordYear)
  const number = Number(recordNumber)
  const snapshot = await getDocs(deathCollectionRef)

  return snapshot.docs.some((docSnap) => {
    if (excludeId && docSnap.id === excludeId) return false
    const data = docSnap.data() || {}
    return (
      Number(data.recordYear) === year && Number(data.recordNumber) === number
    )
  })
}

function buildDeathEventPayload(recordId, record) {
  const deceasedName = getDeceasedDisplayName(record)
  const titleName =
    deceasedName && deceasedName !== '—' ? deceasedName : 'Death'
  const time = normalizeTimeValue(record.time) || '08:00'

  return {
    source: EVENT_SOURCES.DEATH,
    relatedRecordId: recordId,
    title: `Death - ${titleName}`,
    // Calendar schedules burial, not date of death.
    date: record.burialDate,
    time,
    description: record.remarks || '',
  }
}

function isFriendlyDeathError(error) {
  if (!(error instanceof Error)) return false
  return (
    error.message === MESSAGES.ERROR.DEATH_REQUIRED_FIELDS ||
    error.message === MESSAGES.ERROR.DEATH_CREATE_VALIDATION ||
    error.message === MESSAGES.ERROR.DEATH_DUPLICATE_RECORD ||
    error.message.includes('Burial Date') ||
    error.message.includes('Date of Birth') ||
    error.message.includes('Record number') ||
    error.message.includes('Record year') ||
    error.message.includes('Age must')
  )
}

/**
 * Create a new death record in Firestore.
 * Also syncs a linked calendar event.
 *
 * @param {object} data
 * @param {{ userEmail?: string, user?: { email?: string }, createdBy?: string }} [options]
 * @returns {Promise<object>}
 */
export async function createDeathRecord(data, options = {}) {
  try {
    const normalized = normalizeIncomingPayload(data)
    const recordType = normalizeRecordType(normalized.recordType)

    let existingForNumbering = null

    if (recordType === 'old') {
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
      const currentYear = new Date().getFullYear()
      existingForNumbering = await getDeathRecords()
      const next = getNextDeathRecordParts(existingForNumbering, currentYear)
      normalized.recordYear = next.recordYear
      normalized.recordNumber = next.recordNumber
    }

    normalized.recordType = recordType
    validateDeathPayload(normalized)

    const taken = existingForNumbering
      ? existingForNumbering.some(
          (item) =>
            Number(item.recordYear) === Number(normalized.recordYear) &&
            Number(item.recordNumber) === Number(normalized.recordNumber),
        )
      : await isRecordNumberTaken(
          normalized.recordYear,
          normalized.recordNumber,
        )
    if (taken) {
      throw new Error(MESSAGES.ERROR.DEATH_DUPLICATE_RECORD)
    }

    const actor =
      options.userEmail ||
      options.user?.email ||
      options.createdBy ||
      ''

    const payload = {
      ...buildDeathDocument({
        ...normalized,
        createdBy: actor,
        updatedBy: actor,
      }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(deathCollectionRef, payload)

    try {
      await syncSacramentalEvent(buildDeathEventPayload(docRef.id, payload))
    } catch (syncError) {
      console.error('Failed to sync death calendar event:', syncError)
    }

    return mapDeathDocToUi({
      id: docRef.id,
      ...payload,
    })
  } catch (error) {
    if (isFriendlyDeathError(error)) {
      throw error
    }

    throw new Error(MESSAGES.ERROR.DEATH_CREATE)
  }
}

/**
 * Update an existing death record.
 * Also updates the linked calendar event.
 *
 * @param {string} id
 * @param {object} data
 * @param {{ userEmail?: string, user?: { email?: string }, updatedBy?: string }} [options]
 * @returns {Promise<object>}
 */
export async function updateDeathRecord(id, data, options = {}) {
  try {
    if (!id) {
      throw new Error(MESSAGES.ERROR.DEATH_UPDATE)
    }

    const normalized = normalizeIncomingPayload(data)
    validateDeathPayload(normalized)

    const recordYear = Number(normalized.recordYear)
    const recordNumber = Number(normalized.recordNumber)

    const taken = await isRecordNumberTaken(recordYear, recordNumber, id)
    if (taken) {
      throw new Error(MESSAGES.ERROR.DEATH_DUPLICATE_RECORD)
    }

    const actor =
      options.userEmail ||
      options.user?.email ||
      options.updatedBy ||
      normalized.updatedBy ||
      ''

    const payload = {
      ...buildDeathDocument({
        ...normalized,
        updatedBy: actor,
      }),
      updatedAt: serverTimestamp(),
    }

    delete payload.createdBy

    const docRef = doc(db, COLLECTIONS.DEATH, id)
    await updateDoc(docRef, payload)

    try {
      await syncSacramentalEvent(buildDeathEventPayload(id, payload))
    } catch (syncError) {
      console.error('Failed to sync death calendar event:', syncError)
    }

    return mapDeathDocToUi({
      id,
      ...payload,
    })
  } catch (error) {
    if (isFriendlyDeathError(error)) {
      throw error
    }

    if (
      error instanceof Error &&
      error.message === MESSAGES.ERROR.DEATH_UPDATE
    ) {
      throw error
    }

    throw new Error(MESSAGES.ERROR.DEATH_UPDATE)
  }
}
