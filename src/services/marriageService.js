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
import {
  getRequirementsSummary,
  normalizeSacramentRequirements,
} from '../constants/sacramentRequirements'
import { toLocalDate } from '../utils/date'
import {
  getBrideDisplayName,
  getGroomDisplayName,
} from '../utils/personName'
import { getNextMarriageRecordParts } from '../utils/recordNumber'
import { toProperCase } from '../utils/textFormatter'
import { normalizePlace } from '../utils/philippinePlaces'
import { createAuditLog } from './auditLogService'
import { syncSacramentalEvent } from './eventService'

/**
 * Firestore collection reference for marriage documents.
 */
export const marriageCollectionRef = collection(db, COLLECTIONS.MARRIAGE)

export const MARRIAGE_FIELDS = {
  RECORD_NUMBER: 'recordNumber',
  RECORD_YEAR: 'recordYear',
  RECORD_TYPE: 'recordType',
  MINISTER: 'minister',
  MARRIAGE_DATE: 'marriageDate',
  TIME: 'time',
  MARRIAGE_PLACE: 'marriagePlace',
  REMARKS: 'remarks',
  GROOM_FIRST_NAME: 'groomFirstName',
  GROOM_LAST_NAME: 'groomLastName',
  GROOM_BIRTH_DATE: 'groomBirthDate',
  GROOM_AGE: 'groomAge',
  GROOM_BIRTH_PLACE: 'groomBirthPlace',
  GROOM_NATIONALITY: 'groomNationality',
  GROOM_OCCUPATION: 'groomOccupation',
  GROOM_RESIDENCE: 'groomResidence',
  GROOM_CIVIL_STATUS: 'groomCivilStatus',
  GROOM_FATHER_FIRST_NAME: 'groomFatherFirstName',
  GROOM_FATHER_LAST_NAME: 'groomFatherLastName',
  GROOM_MOTHER_FIRST_NAME: 'groomMotherFirstName',
  GROOM_MOTHER_LAST_NAME: 'groomMotherLastName',
  BRIDE_FIRST_NAME: 'brideFirstName',
  BRIDE_LAST_NAME: 'brideLastName',
  BRIDE_BIRTH_DATE: 'brideBirthDate',
  BRIDE_AGE: 'brideAge',
  BRIDE_BIRTH_PLACE: 'brideBirthPlace',
  BRIDE_NATIONALITY: 'brideNationality',
  BRIDE_OCCUPATION: 'brideOccupation',
  BRIDE_RESIDENCE: 'brideResidence',
  BRIDE_CIVIL_STATUS: 'brideCivilStatus',
  BRIDE_FATHER_FIRST_NAME: 'brideFatherFirstName',
  BRIDE_FATHER_LAST_NAME: 'brideFatherLastName',
  BRIDE_MOTHER_FIRST_NAME: 'brideMotherFirstName',
  BRIDE_MOTHER_LAST_NAME: 'brideMotherLastName',
}

const REQUIRED_FIELDS = [
  MARRIAGE_FIELDS.RECORD_NUMBER,
  MARRIAGE_FIELDS.RECORD_YEAR,
  MARRIAGE_FIELDS.MINISTER,
  MARRIAGE_FIELDS.MARRIAGE_DATE,
  MARRIAGE_FIELDS.MARRIAGE_PLACE,
  MARRIAGE_FIELDS.GROOM_FIRST_NAME,
  MARRIAGE_FIELDS.GROOM_LAST_NAME,
  MARRIAGE_FIELDS.GROOM_BIRTH_DATE,
  MARRIAGE_FIELDS.GROOM_AGE,
  MARRIAGE_FIELDS.GROOM_BIRTH_PLACE,
  MARRIAGE_FIELDS.GROOM_NATIONALITY,
  MARRIAGE_FIELDS.GROOM_OCCUPATION,
  MARRIAGE_FIELDS.GROOM_RESIDENCE,
  MARRIAGE_FIELDS.GROOM_CIVIL_STATUS,
  MARRIAGE_FIELDS.GROOM_FATHER_FIRST_NAME,
  MARRIAGE_FIELDS.GROOM_FATHER_LAST_NAME,
  MARRIAGE_FIELDS.GROOM_MOTHER_FIRST_NAME,
  MARRIAGE_FIELDS.GROOM_MOTHER_LAST_NAME,
  MARRIAGE_FIELDS.BRIDE_FIRST_NAME,
  MARRIAGE_FIELDS.BRIDE_LAST_NAME,
  MARRIAGE_FIELDS.BRIDE_BIRTH_DATE,
  MARRIAGE_FIELDS.BRIDE_AGE,
  MARRIAGE_FIELDS.BRIDE_BIRTH_PLACE,
  MARRIAGE_FIELDS.BRIDE_NATIONALITY,
  MARRIAGE_FIELDS.BRIDE_OCCUPATION,
  MARRIAGE_FIELDS.BRIDE_RESIDENCE,
  MARRIAGE_FIELDS.BRIDE_CIVIL_STATUS,
  MARRIAGE_FIELDS.BRIDE_FATHER_FIRST_NAME,
  MARRIAGE_FIELDS.BRIDE_FATHER_LAST_NAME,
  MARRIAGE_FIELDS.BRIDE_MOTHER_FIRST_NAME,
  MARRIAGE_FIELDS.BRIDE_MOTHER_LAST_NAME,
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

function normalizeSponsors(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => ({
      firstName: toProperCase(item?.firstName),
      middleName: toProperCase(item?.middleName),
      lastName: toProperCase(item?.lastName),
      suffix: toProperCase(item?.suffix),
    }))
    .filter((item) => item.firstName || item.lastName)
}

function normalizePlaceValue(value) {
  if (!value || typeof value !== 'object') return null
  return normalizePlace(value)
}

function normalizeIncomingPayload(data = {}) {
  return {
    ...data,
    minister: data.minister ?? data.officiatingMinister ?? '',
    recordType: normalizeRecordType(data.recordType),
    principalSponsors: normalizeSponsors(
      data.principalSponsors ?? data.sponsors,
    ),
    requirements: normalizeSacramentRequirements('marriage', data.requirements),
  }
}

function validateMarriagePayload(data) {
  if (!data || typeof data !== 'object') {
    throw new Error(MESSAGES.ERROR.MARRIAGE_CREATE_VALIDATION)
  }

  const missing = REQUIRED_FIELDS.filter((field) => {
    const value = data[field]
    if (value === null || value === undefined) return true
    if (typeof value === 'string' && !value.trim()) return true
    return false
  })

  if (missing.length > 0) {
    throw new Error(MESSAGES.ERROR.MARRIAGE_REQUIRED_FIELDS)
  }

  const recordNumber = Number(data.recordNumber)
  const recordYear = Number(data.recordYear)
  const groomAge = Number(data.groomAge)
  const brideAge = Number(data.brideAge)

  if (!Number.isInteger(recordNumber) || recordNumber < 1) {
    throw new Error('Record number must be a positive integer.')
  }

  if (!Number.isInteger(recordYear) || recordYear < 1000) {
    throw new Error('Record year must be a valid year.')
  }

  if (!Number.isInteger(groomAge) || groomAge < 0) {
    throw new Error('Groom age must be a valid number.')
  }

  if (!Number.isInteger(brideAge) || brideAge < 0) {
    throw new Error('Bride age must be a valid number.')
  }

  if (
    String(data.groomOccupation || '').trim() === 'Others' &&
    !String(data.groomOccupationOther || '').trim()
  ) {
    throw new Error(MESSAGES.ERROR.MARRIAGE_REQUIRED_FIELDS)
  }

  if (
    String(data.brideOccupation || '').trim() === 'Others' &&
    !String(data.brideOccupationOther || '').trim()
  ) {
    throw new Error(MESSAGES.ERROR.MARRIAGE_REQUIRED_FIELDS)
  }

  const marriageDate = normalizeDateValue(data.marriageDate)
  const groomBirthDate = normalizeDateValue(data.groomBirthDate)
  const brideBirthDate = normalizeDateValue(data.brideBirthDate)

  if (!marriageDate || !groomBirthDate || !brideBirthDate) {
    throw new Error(MESSAGES.ERROR.MARRIAGE_REQUIRED_FIELDS)
  }

  if (groomBirthDate > marriageDate) {
    throw new Error("Groom's birth date cannot be later than the marriage date.")
  }

  if (brideBirthDate > marriageDate) {
    throw new Error("Bride's birth date cannot be later than the marriage date.")
  }
}

/**
 * Builds a Firestore document using the marriage registry schema.
 */
export function buildMarriageDocument(data = {}) {
  const normalized = normalizeIncomingPayload(data)

  return {
    recordNumber: Number(normalized.recordNumber),
    recordYear: Number(normalized.recordYear),
    recordType: normalizeRecordType(normalized.recordType),
    minister: toProperCase(normalized.minister),
    marriageDate: normalizeDateValue(normalized.marriageDate),
    time: normalizeTimeValue(normalized.time),
    marriagePlace: normalizeText(normalized.marriagePlace),
    remarks: normalizeText(normalized.remarks),

    groomFirstName: toProperCase(normalized.groomFirstName),
    groomMiddleName: toProperCase(normalized.groomMiddleName),
    groomLastName: toProperCase(normalized.groomLastName),
    groomSuffix: toProperCase(normalized.groomSuffix),
    groomBirthDate: normalizeDateValue(normalized.groomBirthDate),
    groomAge: Number(normalized.groomAge),
    groomBirthPlace: normalizeText(normalized.groomBirthPlace),
    groomBirthPlacePlace: normalizePlaceValue(normalized.groomBirthPlacePlace),
    groomNationality: normalizeText(normalized.groomNationality),
    groomOccupation: normalizeText(normalized.groomOccupation),
    groomOccupationOther: normalizeText(normalized.groomOccupationOther),
    groomResidence: normalizeText(normalized.groomResidence),
    groomResidencePlace: normalizePlaceValue(normalized.groomResidencePlace),
    groomCivilStatus: normalizeText(normalized.groomCivilStatus),
    groomFatherFirstName: toProperCase(normalized.groomFatherFirstName),
    groomFatherMiddleName: toProperCase(normalized.groomFatherMiddleName),
    groomFatherLastName: toProperCase(normalized.groomFatherLastName),
    groomFatherSuffix: toProperCase(normalized.groomFatherSuffix),
    groomMotherFirstName: toProperCase(normalized.groomMotherFirstName),
    groomMotherMiddleName: toProperCase(normalized.groomMotherMiddleName),
    groomMotherLastName: toProperCase(normalized.groomMotherLastName),
    groomMotherSuffix: toProperCase(normalized.groomMotherSuffix),

    brideFirstName: toProperCase(normalized.brideFirstName),
    brideMiddleName: toProperCase(normalized.brideMiddleName),
    brideLastName: toProperCase(normalized.brideLastName),
    brideSuffix: toProperCase(normalized.brideSuffix),
    brideBirthDate: normalizeDateValue(normalized.brideBirthDate),
    brideAge: Number(normalized.brideAge),
    brideBirthPlace: normalizeText(normalized.brideBirthPlace),
    brideBirthPlacePlace: normalizePlaceValue(normalized.brideBirthPlacePlace),
    brideNationality: normalizeText(normalized.brideNationality),
    brideOccupation: normalizeText(normalized.brideOccupation),
    brideOccupationOther: normalizeText(normalized.brideOccupationOther),
    brideResidence: normalizeText(normalized.brideResidence),
    brideResidencePlace: normalizePlaceValue(normalized.brideResidencePlace),
    brideCivilStatus: normalizeText(normalized.brideCivilStatus),
    brideFatherFirstName: toProperCase(normalized.brideFatherFirstName),
    brideFatherMiddleName: toProperCase(normalized.brideFatherMiddleName),
    brideFatherLastName: toProperCase(normalized.brideFatherLastName),
    brideFatherSuffix: toProperCase(normalized.brideFatherSuffix),
    brideMotherFirstName: toProperCase(normalized.brideMotherFirstName),
    brideMotherMiddleName: toProperCase(normalized.brideMotherMiddleName),
    brideMotherLastName: toProperCase(normalized.brideMotherLastName),
    brideMotherSuffix: toProperCase(normalized.brideMotherSuffix),

    principalSponsors: normalizeSponsors(normalized.principalSponsors),
    requirements: normalizeSacramentRequirements(
      'marriage',
      normalized.requirements,
    ),
    requirementsStatus: getRequirementsSummary(
      'marriage',
      normalized.requirements,
    ).status,

    createdBy: normalizeText(normalized.createdBy),
    updatedBy: normalizeText(normalized.updatedBy),
  }
}

export function mapMarriageDocToUi(docData = {}) {
  const requirements = normalizeSacramentRequirements(
    'marriage',
    docData.requirements,
  )
  const summary = getRequirementsSummary('marriage', requirements)

  return {
    ...docData,
    recordType: normalizeRecordType(docData.recordType),
    minister: docData.minister || docData.officiatingMinister || '',
    principalSponsors: normalizeSponsors(
      docData.principalSponsors ?? docData.sponsors,
    ),
    requirements,
    requirementsStatus: summary.status,
  }
}

export async function getMarriageRecords() {
  try {
    const snapshot = await getDocs(marriageCollectionRef)

    return snapshot.docs
      .map((docSnap) =>
        mapMarriageDocToUi({
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
    throw new Error(MESSAGES.ERROR.MARRIAGE_FETCH)
  }
}

export async function getMarriageRecordById(id) {
  try {
    if (!id) {
      throw new Error(MESSAGES.ERROR.MARRIAGE_REQUIRED_FIELDS)
    }

    const snapshot = await getDoc(doc(db, COLLECTIONS.MARRIAGE, id))
    if (!snapshot.exists()) return null

    return mapMarriageDocToUi({
      id: snapshot.id,
      ...snapshot.data(),
    })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === MESSAGES.ERROR.MARRIAGE_REQUIRED_FIELDS
    ) {
      throw error
    }
    throw new Error(MESSAGES.ERROR.MARRIAGE_FETCH)
  }
}

async function isRecordNumberTaken(recordYear, recordNumber, excludeId) {
  const year = Number(recordYear)
  const number = Number(recordNumber)
  const snapshot = await getDocs(marriageCollectionRef)

  return snapshot.docs.some((docSnap) => {
    if (excludeId && docSnap.id === excludeId) return false
    const data = docSnap.data() || {}
    return (
      Number(data.recordYear) === year && Number(data.recordNumber) === number
    )
  })
}

function buildMarriageEventPayload(recordId, record) {
  const groom = getGroomDisplayName(record)
  const bride = getBrideDisplayName(record)
  const couple =
    groom !== '—' && bride !== '—'
      ? `${groom} & ${bride}`
      : groom !== '—'
        ? groom
        : bride !== '—'
          ? bride
          : 'Marriage'
  const time = normalizeTimeValue(record.time) || '08:00'

  return {
    source: EVENT_SOURCES.MARRIAGE,
    relatedRecordId: recordId,
    title: `Marriage - ${couple}`,
    date: record.marriageDate,
    time,
    description: record.remarks || '',
  }
}

function isFriendlyMarriageError(error) {
  if (!(error instanceof Error)) return false
  return (
    error.message === MESSAGES.ERROR.MARRIAGE_REQUIRED_FIELDS ||
    error.message === MESSAGES.ERROR.MARRIAGE_CREATE_VALIDATION ||
    error.message === MESSAGES.ERROR.MARRIAGE_DUPLICATE_RECORD ||
    error.message.includes('birth date') ||
    error.message.includes('Record number') ||
    error.message.includes('Record year') ||
    error.message.includes('age must')
  )
}

async function writeMarriageAudit(action, options = {}) {
  await createAuditLog({
    action,
    module: 'Marriage',
    performedBy: options.userEmail || options.user?.email || '',
    performedByUid: options.user?.uid || '',
  })
}

export async function createMarriageRecord(data, options = {}) {
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
      existingForNumbering = await getMarriageRecords()
      const next = getNextMarriageRecordParts(existingForNumbering, currentYear)
      normalized.recordYear = next.recordYear
      normalized.recordNumber = next.recordNumber
    }

    normalized.recordType = recordType
    validateMarriagePayload(normalized)

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
      throw new Error(MESSAGES.ERROR.MARRIAGE_DUPLICATE_RECORD)
    }

    const actor =
      options.userEmail ||
      options.user?.email ||
      options.createdBy ||
      ''

    const payload = {
      ...buildMarriageDocument({
        ...normalized,
        createdBy: actor,
        updatedBy: actor,
      }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(marriageCollectionRef, payload)

    try {
      await syncSacramentalEvent(buildMarriageEventPayload(docRef.id, payload))
    } catch (syncError) {
      console.error('Failed to sync marriage calendar event:', syncError)
    }

    await writeMarriageAudit('Created Marriage Record', options)

    return mapMarriageDocToUi({
      id: docRef.id,
      ...payload,
    })
  } catch (error) {
    if (isFriendlyMarriageError(error)) {
      throw error
    }

    throw new Error(MESSAGES.ERROR.MARRIAGE_CREATE)
  }
}

export async function updateMarriageRecord(id, data, options = {}) {
  try {
    if (!id) {
      throw new Error(MESSAGES.ERROR.MARRIAGE_UPDATE)
    }

    const normalized = normalizeIncomingPayload(data)
    validateMarriagePayload(normalized)

    const recordYear = Number(normalized.recordYear)
    const recordNumber = Number(normalized.recordNumber)

    const taken = await isRecordNumberTaken(recordYear, recordNumber, id)
    if (taken) {
      throw new Error(MESSAGES.ERROR.MARRIAGE_DUPLICATE_RECORD)
    }

    const actor =
      options.userEmail ||
      options.user?.email ||
      options.updatedBy ||
      normalized.updatedBy ||
      ''

    const payload = {
      ...buildMarriageDocument({
        ...normalized,
        updatedBy: actor,
      }),
      updatedAt: serverTimestamp(),
    }

    delete payload.createdBy

    const docRef = doc(db, COLLECTIONS.MARRIAGE, id)
    await updateDoc(docRef, payload)

    try {
      await syncSacramentalEvent(buildMarriageEventPayload(id, payload))
    } catch (syncError) {
      console.error('Failed to sync marriage calendar event:', syncError)
    }

    await writeMarriageAudit('Updated Marriage Record', options)

    return mapMarriageDocToUi({
      id,
      ...payload,
    })
  } catch (error) {
    if (isFriendlyMarriageError(error)) {
      throw error
    }

    if (
      error instanceof Error &&
      error.message === MESSAGES.ERROR.MARRIAGE_UPDATE
    ) {
      throw error
    }

    throw new Error(MESSAGES.ERROR.MARRIAGE_UPDATE)
  }
}
