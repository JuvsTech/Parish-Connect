import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import {
  COLLECTIONS,
  DEFAULT_MASS_INTENTION_RECIPIENT_TYPE,
  DEFAULT_MASS_INTENTION_STATUS,
  EVENT_SOURCES,
  MASS_INTENTION_OTHER_TYPE,
  MASS_INTENTION_RECIPIENT_TYPE,
  MASS_INTENTION_RECIPIENT_TYPE_VALUES,
  MASS_INTENTION_STATUS_OPTIONS,
  MASS_INTENTION_TYPE_OPTIONS,
  MESSAGES,
  isRecipientTypeAllowed,
  resolveAllowedRecipientType,
} from '../constants'
import { toLocalDate } from '../utils/date'
import {
  formatMassIntentionResidence,
  getOfferedForDisplayName,
  getRequesterDisplayName,
} from '../utils/personName'
import {
  formatMassIntentionRecordNumber,
  getNextMassIntentionRecordParts,
  isRecordNumberDuplicate,
} from '../utils/recordNumber'
import { toProperCase } from '../utils/textFormatter'
import { createAuditLog } from './auditLogService'
import {
  deleteEventsByRelatedRecord,
  syncSacramentalEvent,
} from './eventService'

export const massIntentionCollectionRef = collection(
  db,
  COLLECTIONS.MASS_INTENTIONS,
)

function normalizeText(value) {
  return String(value ?? '').trim()
}

function toDateOrNull(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value?.toDate === 'function') return value.toDate()
  if (typeof value === 'string') return toLocalDate(value)
  return null
}

function buildResidenceString(payload = {}) {
  if (normalizeText(payload.residence)) return normalizeText(payload.residence)
  return formatMassIntentionResidence(payload)
}

function buildMassIntentionEventPayload(recordId, record) {
  const offeredFor = getOfferedForDisplayName(record)
  const intentionType =
    record.intentionType === MASS_INTENTION_OTHER_TYPE
      ? normalizeText(record.otherIntention) || MASS_INTENTION_OTHER_TYPE
      : normalizeText(record.intentionType)

  return {
    source: EVENT_SOURCES.MASS_INTENTION,
    relatedRecordId: recordId,
    title: 'Mass Intention',
    date: record.massDate,
    time: record.massTime || '08:00',
    description: [
      `Intention Type: ${intentionType || '—'}`,
      `Offered For: ${offeredFor}`,
      `Celebrant: ${normalizeText(record.celebrantName) || '—'}`,
    ].join('\n'),
  }
}

async function writeAudit(action, options = {}, details = null) {
  await createAuditLog({
    action,
    module: 'Mass Intentions',
    performedBy: options.userEmail || options.user?.email || '',
    performedByUid: options.user?.uid || '',
    details,
  })
}

function validateMassIntentionPayload(payload, { existingRecords = [], excludeId } = {}) {
  const errors = {}

  const recordYear = Number(payload.recordYear)
  const recordNumber = Number(payload.recordNumber)
  if (!Number.isInteger(recordYear) || recordYear < 1000) {
    errors.intentionNumber = 'Intention number year is invalid.'
  }
  if (!Number.isInteger(recordNumber) || recordNumber < 1) {
    errors.intentionNumber = 'Intention number is required.'
  }
  if (
    Number.isInteger(recordYear) &&
    Number.isInteger(recordNumber) &&
    isRecordNumberDuplicate(existingRecords, recordYear, recordNumber, excludeId)
  ) {
    errors.intentionNumber = MESSAGES.ERROR.MASS_INTENTION_DUPLICATE_RECORD
  }

  if (!payload.massDate) errors.massDate = 'Mass date is required.'
  if (!normalizeText(payload.massTime)) errors.massTime = 'Mass time is required.'

  const intentionType = normalizeText(payload.intentionType)
  if (!intentionType) {
    errors.intentionType = 'Intention type is required.'
  } else if (!MASS_INTENTION_TYPE_OPTIONS.includes(intentionType)) {
    errors.intentionType = 'Please select a valid intention type.'
  }
  if (
    intentionType === MASS_INTENTION_OTHER_TYPE &&
    !normalizeText(payload.otherIntention)
  ) {
    errors.otherIntention = 'Please describe the other intention.'
  }

  const recipientType =
    normalizeText(payload.recipientType).toLowerCase() ||
    DEFAULT_MASS_INTENTION_RECIPIENT_TYPE
  if (!MASS_INTENTION_RECIPIENT_TYPE_VALUES.includes(recipientType)) {
    errors.recipientType = 'Please select a valid recipient type.'
  } else if (
    intentionType &&
    !isRecipientTypeAllowed(intentionType, recipientType)
  ) {
    errors.recipientType =
      'This recipient type is not allowed for the selected intention type.'
  } else if (recipientType === MASS_INTENTION_RECIPIENT_TYPE.INDIVIDUAL) {
    if (!normalizeText(payload.recipientFirstName)) {
      errors.recipientFirstName = 'First name is required.'
    }
    if (!normalizeText(payload.recipientLastName)) {
      errors.recipientLastName = 'Last name is required.'
    }
  } else if (recipientType === MASS_INTENTION_RECIPIENT_TYPE.COUPLE) {
    if (!normalizeText(payload.spouse1FirstName)) {
      errors.spouse1FirstName = 'Spouse 1 first name is required.'
    }
    if (!normalizeText(payload.spouse1LastName)) {
      errors.spouse1LastName = 'Spouse 1 last name is required.'
    }
    if (!normalizeText(payload.spouse2FirstName)) {
      errors.spouse2FirstName = 'Spouse 2 first name is required.'
    }
    if (!normalizeText(payload.spouse2LastName)) {
      errors.spouse2LastName = 'Spouse 2 last name is required.'
    }
  } else if (recipientType === MASS_INTENTION_RECIPIENT_TYPE.FAMILY) {
    if (!normalizeText(payload.familyName)) {
      errors.familyName = 'Family name is required.'
    }
  } else if (recipientType === MASS_INTENTION_RECIPIENT_TYPE.ORGANIZATION) {
    if (!normalizeText(payload.organizationName)) {
      errors.organizationName = 'Organization / Ministry name is required.'
    }
  } else if (recipientType === MASS_INTENTION_RECIPIENT_TYPE.OTHER) {
    if (!normalizeText(payload.offeredForDescription)) {
      errors.offeredForDescription = 'Offered For is required.'
    }
  }

  if (!normalizeText(payload.requesterFirstName)) {
    errors.requesterFirstName = 'First name is required.'
  }
  if (!normalizeText(payload.requesterLastName)) {
    errors.requesterLastName = 'Last name is required.'
  }

  if (!normalizeText(payload.celebrantName)) {
    errors.celebrantName = 'Celebrant is required.'
  }

  const status = normalizeText(payload.status) || DEFAULT_MASS_INTENTION_STATUS
  if (!MASS_INTENTION_STATUS_OPTIONS.includes(status)) {
    errors.status = 'Please select a valid status.'
  }

  return errors
}

function buildMassIntentionDocument(payload) {
  const recordYear = Number(payload.recordYear)
  const recordNumber = Number(payload.recordNumber)
  const intentionNumber =
    normalizeText(payload.intentionNumber) ||
    formatMassIntentionRecordNumber(recordYear, recordNumber)

  const province = normalizeText(payload.province)
  const municipality = normalizeText(payload.municipality)
  const barangay = normalizeText(payload.barangay)
  const residence = buildResidenceString({
    residence: payload.residence,
    province,
    municipality,
    barangay,
  })

  const intentionType = normalizeText(payload.intentionType)
  const recipientType = resolveAllowedRecipientType(
    intentionType,
    normalizeText(payload.recipientType).toLowerCase() ||
      DEFAULT_MASS_INTENTION_RECIPIENT_TYPE,
  )

  const isIndividual =
    recipientType === MASS_INTENTION_RECIPIENT_TYPE.INDIVIDUAL
  const isCouple = recipientType === MASS_INTENTION_RECIPIENT_TYPE.COUPLE
  const isFamily = recipientType === MASS_INTENTION_RECIPIENT_TYPE.FAMILY
  const isOrganization =
    recipientType === MASS_INTENTION_RECIPIENT_TYPE.ORGANIZATION
  const isOther = recipientType === MASS_INTENTION_RECIPIENT_TYPE.OTHER

  return {
    intentionNumber,
    recordYear,
    recordNumber,
    requestDate: toDateOrNull(payload.requestDate) || new Date(),
    massDate: toDateOrNull(payload.massDate),
    massTime: normalizeText(payload.massTime),
    intentionType,
    otherIntention:
      intentionType === MASS_INTENTION_OTHER_TYPE
        ? normalizeText(payload.otherIntention)
        : '',
    recipientType,
    recipientFirstName: isIndividual
      ? toProperCase(payload.recipientFirstName)
      : '',
    recipientMiddleName: isIndividual
      ? toProperCase(payload.recipientMiddleName)
      : '',
    recipientLastName: isIndividual
      ? toProperCase(payload.recipientLastName)
      : '',
    recipientSuffix: isIndividual
      ? toProperCase(payload.recipientSuffix)
      : '',
    spouse1FirstName: isCouple ? toProperCase(payload.spouse1FirstName) : '',
    spouse1MiddleName: isCouple ? toProperCase(payload.spouse1MiddleName) : '',
    spouse1LastName: isCouple ? toProperCase(payload.spouse1LastName) : '',
    spouse1Suffix: isCouple ? toProperCase(payload.spouse1Suffix) : '',
    spouse2FirstName: isCouple ? toProperCase(payload.spouse2FirstName) : '',
    spouse2MiddleName: isCouple ? toProperCase(payload.spouse2MiddleName) : '',
    spouse2LastName: isCouple ? toProperCase(payload.spouse2LastName) : '',
    spouse2Suffix: isCouple ? toProperCase(payload.spouse2Suffix) : '',
    familyName: isFamily ? toProperCase(payload.familyName) : '',
    organizationName: isOrganization
      ? normalizeText(payload.organizationName)
      : '',
    offeredForDescription: isOther
      ? normalizeText(payload.offeredForDescription)
      : '',
    requesterFirstName: toProperCase(payload.requesterFirstName),
    requesterMiddleName: toProperCase(payload.requesterMiddleName),
    requesterLastName: toProperCase(payload.requesterLastName),
    requesterSuffix: toProperCase(payload.requesterSuffix),
    contactNumber: normalizeText(payload.contactNumber),
    province,
    municipality,
    barangay,
    residence,
    celebrantId: normalizeText(payload.celebrantId),
    celebrantName: toProperCase(payload.celebrantName),
    remarks: normalizeText(payload.remarks),
    status: normalizeText(payload.status) || DEFAULT_MASS_INTENTION_STATUS,
  }
}

export function mapMassIntentionDocToUi(docData = {}) {
  const offeredForDisplayName = getOfferedForDisplayName(docData)
  return {
    id: docData.id,
    ...docData,
    intentionNumber:
      normalizeText(docData.intentionNumber) ||
      formatMassIntentionRecordNumber(docData.recordYear, docData.recordNumber),
    offeredForDisplayName,
    intentionForDisplayName: offeredForDisplayName,
    requesterDisplayName: getRequesterDisplayName(docData),
    residenceDisplay: formatMassIntentionResidence(docData),
  }
}

/**
 * Fetch all Mass Intention records, newest first.
 */
export async function getMassIntentionRecords() {
  try {
    const snapshot = await getDocs(massIntentionCollectionRef)
    const rows = snapshot.docs.map((item) =>
      mapMassIntentionDocToUi({ id: item.id, ...item.data() }),
    )

    rows.sort((a, b) => {
      const yearDiff = Number(b.recordYear || 0) - Number(a.recordYear || 0)
      if (yearDiff !== 0) return yearDiff
      return Number(b.recordNumber || 0) - Number(a.recordNumber || 0)
    })

    return rows
  } catch {
    throw new Error(MESSAGES.ERROR.MASS_INTENTION_FETCH)
  }
}

/**
 * Create a Mass Intention and sync calendar + audit log.
 */
export async function createMassIntentionRecord(payload, options = {}) {
  const existingRecords =
    options.existingRecords || (await getMassIntentionRecords())

  const nextParts = getNextMassIntentionRecordParts(
    existingRecords,
    payload.recordYear || new Date().getFullYear(),
  )

  const normalizedPayload = {
    ...payload,
    recordYear: nextParts.recordYear,
    recordNumber: nextParts.recordNumber,
    intentionNumber: formatMassIntentionRecordNumber(
      nextParts.recordYear,
      nextParts.recordNumber,
    ),
    requestDate: payload.requestDate || new Date(),
    status: payload.status || DEFAULT_MASS_INTENTION_STATUS,
  }

  const errors = validateMassIntentionPayload(normalizedPayload, {
    existingRecords,
  })
  if (Object.keys(errors).length > 0) {
    const error = new Error(MESSAGES.ERROR.MASS_INTENTION_CREATE_VALIDATION)
    error.fieldErrors = errors
    throw error
  }

  try {
    const document = buildMassIntentionDocument(normalizedPayload)
    const actor = normalizeText(options.userEmail || options.user?.email)
    const docRef = await addDoc(massIntentionCollectionRef, {
      ...document,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: actor,
      updatedBy: actor,
    })

    try {
      await syncSacramentalEvent(
        buildMassIntentionEventPayload(docRef.id, document),
      )
    } catch (syncError) {
      console.error('Failed to sync Mass Intention calendar event:', syncError)
    }

    await writeAudit('Created Mass Intention', options, document.intentionNumber)

    return mapMassIntentionDocToUi({ id: docRef.id, ...document })
  } catch (error) {
    if (error?.fieldErrors) throw error
    throw new Error(MESSAGES.ERROR.MASS_INTENTION_CREATE)
  }
}

/**
 * Update a Mass Intention and sync calendar + audit log.
 */
export async function updateMassIntentionRecord(id, payload, options = {}) {
  if (!id) throw new Error(MESSAGES.ERROR.MASS_INTENTION_UPDATE)

  const existingRecords =
    options.existingRecords || (await getMassIntentionRecords())
  const previous = existingRecords.find((item) => item.id === id)

  const normalizedPayload = {
    ...payload,
    recordYear: Number(payload.recordYear),
    recordNumber: Number(payload.recordNumber),
    intentionNumber:
      normalizeText(payload.intentionNumber) ||
      formatMassIntentionRecordNumber(payload.recordYear, payload.recordNumber),
  }

  const errors = validateMassIntentionPayload(normalizedPayload, {
    existingRecords,
    excludeId: id,
  })
  if (Object.keys(errors).length > 0) {
    const error = new Error(MESSAGES.ERROR.MASS_INTENTION_CREATE_VALIDATION)
    error.fieldErrors = errors
    throw error
  }

  try {
    const document = buildMassIntentionDocument(normalizedPayload)
    const actor = normalizeText(options.userEmail || options.user?.email)
    await updateDoc(doc(db, COLLECTIONS.MASS_INTENTIONS, id), {
      ...document,
      updatedAt: serverTimestamp(),
      updatedBy: actor,
    })

    try {
      await syncSacramentalEvent(buildMassIntentionEventPayload(id, document))
    } catch (syncError) {
      console.error('Failed to sync Mass Intention calendar event:', syncError)
    }

    const statusChanged =
      previous &&
      normalizeText(previous.status) !== normalizeText(document.status)

    await writeAudit(
      statusChanged ? 'Changed Mass Intention Status' : 'Updated Mass Intention',
      options,
      document.intentionNumber,
    )

    return mapMassIntentionDocToUi({ id, ...document })
  } catch (error) {
    if (error?.fieldErrors) throw error
    throw new Error(MESSAGES.ERROR.MASS_INTENTION_UPDATE)
  }
}

/**
 * Dashboard summary for Mass Intentions.
 */
export async function getMassIntentionDashboardStats() {
  try {
    const records = await getMassIntentionRecords()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const pendingCount = records.filter(
      (item) => normalizeText(item.status) === 'Pending',
    ).length

    const todayIntentions = records
      .filter((item) => {
        const date = toDateOrNull(item.massDate)
        if (!date) return false
        const key = new Date(date)
        key.setHours(0, 0, 0, 0)
        return key.getTime() === today.getTime()
      })
      .sort((a, b) =>
        normalizeText(a.massTime).localeCompare(normalizeText(b.massTime)),
      )

    const todayScheduledCount = todayIntentions.filter(
      (item) => normalizeText(item.status) === 'Scheduled',
    ).length

    return {
      pendingCount,
      todayScheduledCount,
      todayIntentions,
    }
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error(MESSAGES.ERROR.MASS_INTENTION_LOAD)
  }
}

/**
 * Delete a Mass Intention, its calendar event, and write an audit log.
 */
export async function deleteMassIntentionRecord(id, options = {}) {
  if (!id) throw new Error(MESSAGES.ERROR.MASS_INTENTION_DELETE)

  try {
    const existingRecords =
      options.existingRecords || (await getMassIntentionRecords())
    const previous = existingRecords.find((item) => item.id === id)

    await deleteDoc(doc(db, COLLECTIONS.MASS_INTENTIONS, id))

    try {
      await deleteEventsByRelatedRecord(id, EVENT_SOURCES.MASS_INTENTION)
    } catch (syncError) {
      console.error('Failed to delete Mass Intention calendar event:', syncError)
    }

    await writeAudit(
      'Deleted Mass Intention',
      options,
      previous?.intentionNumber || id,
    )

    return true
  } catch {
    throw new Error(MESSAGES.ERROR.MASS_INTENTION_DELETE)
  }
}
