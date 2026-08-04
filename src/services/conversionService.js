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
import { getConvertDisplayName } from '../utils/personName'
import { getNextConversionRecordParts } from '../utils/recordNumber'
import { toProperCase } from '../utils/textFormatter'
import {
  getRequirementsSummary,
  normalizeSacramentRequirements,
} from '../constants/sacramentRequirements'
import { syncSacramentalEvent } from './eventService'

/**
 * Firestore collection reference for conversion documents.
 * Collection is created automatically on the first successful write.
 */
export const conversionCollectionRef = collection(db, COLLECTIONS.CONVERSION)

/**
 * Conversion Firestore schema (document fields only).
 *
 * {
 *   recordNumber: number,
 *   recordYear: number,
 *   recordType: 'new' | 'old',
 *   dateOfReception: Timestamp | Date,
 *   receivingMinister: string,
 *   firstName: string,
 *   middleName: string,
 *   lastName: string,
 *   suffix: string,
 *   province: string,
 *   municipality: string,
 *   barangay: string,
 *   fatherFirstName: string,
 *   fatherMiddleName: string,
 *   fatherLastName: string,
 *   fatherSuffix: string,
 *   motherFirstName: string,
 *   motherMiddleName: string,
 *   motherLastName: string,
 *   motherSuffix: string,
 *   originalBaptismDate: Timestamp | Date | null,
 *   originalBaptismDenomination: string,
 *   originalBaptismPlace: string,
 *   observanda: string,
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp,
 *   createdBy: string,
 *   updatedBy: string,
 * }
 */
export const CONVERSION_FIELDS = {
  RECORD_NUMBER: 'recordNumber',
  RECORD_YEAR: 'recordYear',
  RECORD_TYPE: 'recordType',
  DATE_OF_RECEPTION: 'dateOfReception',
  RECEIVING_MINISTER: 'receivingMinister',
  FIRST_NAME: 'firstName',
  MIDDLE_NAME: 'middleName',
  LAST_NAME: 'lastName',
  SUFFIX: 'suffix',
  PROVINCE: 'province',
  MUNICIPALITY: 'municipality',
  BARANGAY: 'barangay',
  FATHER_FIRST_NAME: 'fatherFirstName',
  FATHER_MIDDLE_NAME: 'fatherMiddleName',
  FATHER_LAST_NAME: 'fatherLastName',
  FATHER_SUFFIX: 'fatherSuffix',
  MOTHER_FIRST_NAME: 'motherFirstName',
  MOTHER_MIDDLE_NAME: 'motherMiddleName',
  MOTHER_LAST_NAME: 'motherLastName',
  MOTHER_SUFFIX: 'motherSuffix',
  ORIGINAL_BAPTISM_DATE: 'originalBaptismDate',
  ORIGINAL_BAPTISM_DENOMINATION: 'originalBaptismDenomination',
  ORIGINAL_BAPTISM_PLACE: 'originalBaptismPlace',
  OBSERVANDA: 'observanda',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  CREATED_BY: 'createdBy',
  UPDATED_BY: 'updatedBy',
}

const REQUIRED_FIELDS = [
  CONVERSION_FIELDS.RECORD_NUMBER,
  CONVERSION_FIELDS.RECORD_YEAR,
  CONVERSION_FIELDS.FIRST_NAME,
  CONVERSION_FIELDS.LAST_NAME,
  CONVERSION_FIELDS.DATE_OF_RECEPTION,
  CONVERSION_FIELDS.RECEIVING_MINISTER,
  CONVERSION_FIELDS.ORIGINAL_BAPTISM_DENOMINATION,
  CONVERSION_FIELDS.ORIGINAL_BAPTISM_PLACE,
  CONVERSION_FIELDS.PROVINCE,
  CONVERSION_FIELDS.MUNICIPALITY,
  CONVERSION_FIELDS.BARANGAY,
  CONVERSION_FIELDS.FATHER_FIRST_NAME,
  CONVERSION_FIELDS.FATHER_LAST_NAME,
  CONVERSION_FIELDS.MOTHER_FIRST_NAME,
  CONVERSION_FIELDS.MOTHER_LAST_NAME,
]

function normalizeText(value) {
  return String(value ?? '').trim()
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

function normalizeIncomingPayload(data = {}) {
  return {
    ...data,
    receivingMinister:
      data.receivingMinister ?? data.minister ?? '',
    observanda: data.observanda ?? data.remarks ?? '',
    recordType: normalizeRecordType(data.recordType),
    requirements: normalizeSacramentRequirements(
      'conversion',
      data.requirements,
    ),
  }
}

function validateConversionPayload(data) {
  if (!data || typeof data !== 'object') {
    throw new Error(MESSAGES.ERROR.CONVERSION_CREATE_VALIDATION)
  }

  const missing = REQUIRED_FIELDS.filter((field) => {
    const value = data[field]
    if (value === null || value === undefined) return true
    if (typeof value === 'string' && !value.trim()) return true
    return false
  })

  if (missing.length > 0) {
    throw new Error(MESSAGES.ERROR.CONVERSION_REQUIRED_FIELDS)
  }

  const recordNumber = Number(data.recordNumber)
  const recordYear = Number(data.recordYear)

  if (!Number.isInteger(recordNumber) || recordNumber < 1) {
    throw new Error('Record number must be a positive integer.')
  }

  if (!Number.isInteger(recordYear) || recordYear < 1000) {
    throw new Error('Record year must be a valid year.')
  }

  const dateOfReception = normalizeDateValue(data.dateOfReception)
  if (!dateOfReception) {
    throw new Error(MESSAGES.ERROR.CONVERSION_REQUIRED_FIELDS)
  }
}

/**
 * Builds a Firestore document using the conversion registry schema.
 *
 * @param {object} data
 * @returns {object}
 */
export function buildConversionDocument(data = {}) {
  const normalized = normalizeIncomingPayload(data)

  return {
    recordNumber: Number(normalized.recordNumber),
    recordYear: Number(normalized.recordYear),
    recordType: normalizeRecordType(normalized.recordType),
    dateOfReception: normalizeDateValue(normalized.dateOfReception),
    receivingMinister: toProperCase(normalized.receivingMinister),
    firstName: toProperCase(normalized.firstName),
    middleName: toProperCase(normalized.middleName),
    lastName: toProperCase(normalized.lastName),
    suffix: toProperCase(normalized.suffix),
    province: normalizeText(normalized.province),
    municipality: normalizeText(normalized.municipality),
    barangay: normalizeText(normalized.barangay),
    fatherFirstName: toProperCase(normalized.fatherFirstName),
    fatherMiddleName: toProperCase(normalized.fatherMiddleName),
    fatherLastName: toProperCase(normalized.fatherLastName),
    fatherSuffix: toProperCase(normalized.fatherSuffix),
    motherFirstName: toProperCase(normalized.motherFirstName),
    motherMiddleName: toProperCase(normalized.motherMiddleName),
    motherLastName: toProperCase(normalized.motherLastName),
    motherSuffix: toProperCase(normalized.motherSuffix),
    originalBaptismDate: normalizeDateValue(normalized.originalBaptismDate),
    originalBaptismDenomination: normalizeText(
      normalized.originalBaptismDenomination,
    ),
    originalBaptismPlace: normalizeText(normalized.originalBaptismPlace),
    observanda: normalizeText(normalized.observanda),
    requirements: normalizeSacramentRequirements(
      'conversion',
      normalized.requirements,
    ),
    requirementsStatus: getRequirementsSummary(
      'conversion',
      normalized.requirements,
    ).status,
    createdBy: normalizeText(normalized.createdBy),
    updatedBy: normalizeText(normalized.updatedBy),
  }
}

/**
 * Maps a Firestore conversion document to UI-friendly field aliases.
 *
 * @param {object} docData
 * @returns {object}
 */
export function mapConversionDocToUi(docData = {}) {
  const requirements = normalizeSacramentRequirements(
    'conversion',
    docData.requirements,
  )
  const summary = getRequirementsSummary('conversion', requirements)

  return {
    ...docData,
    recordType: normalizeRecordType(docData.recordType),
    receivingMinister: docData.receivingMinister || docData.minister || '',
    observanda: docData.observanda || docData.remarks || '',
    requirements,
    requirementsStatus: summary.status,
  }
}

/**
 * Fetch conversion records without composite indexes.
 * Newest record year / number first.
 *
 * @returns {Promise<object[]>}
 */
export async function getConversionRecords() {
  try {
    const snapshot = await getDocs(conversionCollectionRef)

    return snapshot.docs
      .map((docSnap) =>
        mapConversionDocToUi({
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
    throw new Error(MESSAGES.ERROR.CONVERSION_FETCH)
  }
}

/**
 * Fetch a single conversion record by document id.
 *
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getConversionRecordById(id) {
  try {
    if (!id) {
      throw new Error(MESSAGES.ERROR.CONVERSION_REQUIRED_FIELDS)
    }

    const snapshot = await getDoc(doc(db, COLLECTIONS.CONVERSION, id))
    if (!snapshot.exists()) return null

    return mapConversionDocToUi({
      id: snapshot.id,
      ...snapshot.data(),
    })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === MESSAGES.ERROR.CONVERSION_REQUIRED_FIELDS
    ) {
      throw error
    }
    throw new Error(MESSAGES.ERROR.CONVERSION_FETCH)
  }
}

async function isRecordNumberTaken(recordYear, recordNumber, excludeId) {
  const year = Number(recordYear)
  const number = Number(recordNumber)
  const snapshot = await getDocs(conversionCollectionRef)

  return snapshot.docs.some((docSnap) => {
    if (excludeId && docSnap.id === excludeId) return false
    const data = docSnap.data() || {}
    return (
      Number(data.recordYear) === year && Number(data.recordNumber) === number
    )
  })
}

function buildConversionEventPayload(recordId, record) {
  const convertName = getConvertDisplayName(record)
  const titleName =
    convertName && convertName !== '—' ? convertName : 'Conversion'

  return {
    source: EVENT_SOURCES.CONVERSION,
    relatedRecordId: recordId,
    title: `Conversion - ${titleName}`,
    date: record.dateOfReception,
    time: '08:00',
    description: record.observanda || '',
  }
}

function isFriendlyConversionError(error) {
  if (!(error instanceof Error)) return false
  return (
    error.message === MESSAGES.ERROR.CONVERSION_REQUIRED_FIELDS ||
    error.message === MESSAGES.ERROR.CONVERSION_CREATE_VALIDATION ||
    error.message === MESSAGES.ERROR.CONVERSION_DUPLICATE_RECORD ||
    error.message.includes('Record number') ||
    error.message.includes('Record year')
  )
}

/**
 * Create a new conversion record in Firestore.
 * Also syncs a linked calendar event.
 *
 * @param {object} data
 * @param {{ userEmail?: string, user?: { email?: string }, createdBy?: string }} [options]
 * @returns {Promise<object>}
 */
export async function createConversionRecord(data, options = {}) {
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
      existingForNumbering = await getConversionRecords()
      const next = getNextConversionRecordParts(
        existingForNumbering,
        currentYear,
      )
      normalized.recordYear = next.recordYear
      normalized.recordNumber = next.recordNumber
    }

    normalized.recordType = recordType
    validateConversionPayload(normalized)

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
      throw new Error(MESSAGES.ERROR.CONVERSION_DUPLICATE_RECORD)
    }

    const actor =
      options.userEmail ||
      options.user?.email ||
      options.createdBy ||
      ''

    const payload = {
      ...buildConversionDocument({
        ...normalized,
        createdBy: actor,
        updatedBy: actor,
      }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(conversionCollectionRef, payload)

    try {
      await syncSacramentalEvent(
        buildConversionEventPayload(docRef.id, payload),
      )
    } catch (syncError) {
      console.error('Failed to sync conversion calendar event:', syncError)
    }

    return mapConversionDocToUi({
      id: docRef.id,
      ...payload,
    })
  } catch (error) {
    if (isFriendlyConversionError(error)) {
      throw error
    }

    throw new Error(MESSAGES.ERROR.CONVERSION_CREATE)
  }
}

/**
 * Update an existing conversion record.
 * Also updates the linked calendar event.
 *
 * @param {string} id
 * @param {object} data
 * @param {{ userEmail?: string, user?: { email?: string }, updatedBy?: string }} [options]
 * @returns {Promise<object>}
 */
export async function updateConversionRecord(id, data, options = {}) {
  try {
    if (!id) {
      throw new Error(MESSAGES.ERROR.CONVERSION_UPDATE)
    }

    const normalized = normalizeIncomingPayload(data)
    validateConversionPayload(normalized)

    const recordYear = Number(normalized.recordYear)
    const recordNumber = Number(normalized.recordNumber)

    const taken = await isRecordNumberTaken(recordYear, recordNumber, id)
    if (taken) {
      throw new Error(MESSAGES.ERROR.CONVERSION_DUPLICATE_RECORD)
    }

    const actor =
      options.userEmail ||
      options.user?.email ||
      options.updatedBy ||
      normalized.updatedBy ||
      ''

    const payload = {
      ...buildConversionDocument({
        ...normalized,
        updatedBy: actor,
      }),
      updatedAt: serverTimestamp(),
    }

    delete payload.createdBy

    const docRef = doc(db, COLLECTIONS.CONVERSION, id)
    await updateDoc(docRef, payload)

    try {
      await syncSacramentalEvent(buildConversionEventPayload(id, payload))
    } catch (syncError) {
      console.error('Failed to sync conversion calendar event:', syncError)
    }

    return mapConversionDocToUi({
      id,
      ...payload,
    })
  } catch (error) {
    if (isFriendlyConversionError(error)) {
      throw error
    }

    if (
      error instanceof Error &&
      error.message === MESSAGES.ERROR.CONVERSION_UPDATE
    ) {
      throw error
    }

    throw new Error(MESSAGES.ERROR.CONVERSION_UPDATE)
  }
}
