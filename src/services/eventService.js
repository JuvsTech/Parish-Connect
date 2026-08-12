import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import {
  COLLECTIONS,
  EVENT_SOURCES,
  MESSAGES,
  SACRAMENTAL_CATEGORY_LABELS,
  isManualEvent,
} from '../constants'
import { toLocalDate } from '../utils/date'
import {
  formatEventConflictMessage,
  timesOverlap,
  toDateKey,
} from '../utils/parishCalendar'

export const eventsCollectionRef = collection(db, COLLECTIONS.EVENTS)

export const EVENT_FIELDS = {
  TITLE: 'title',
  CATEGORY: 'category',
  DATE: 'date',
  TIME: 'time',
  START_TIME: 'startTime',
  END_TIME: 'endTime',
  DESCRIPTION: 'description',
  SOURCE: 'source',
  RELATED_RECORD_ID: 'relatedRecordId',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
}

const DEFAULT_SACRAMENTAL_TIME = '08:00'

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

function normalizeTimeValue(value) {
  const raw = normalizeText(value)
  if (!raw) return DEFAULT_SACRAMENTAL_TIME

  // Accept "HH:mm" or "H:mm"
  const match = raw.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return raw

  const hours = String(Math.min(23, Number(match[1]))).padStart(2, '0')
  const minutes = String(Math.min(59, Number(match[2]))).padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Maps a Firestore event document to a UI-friendly shape.
 *
 * @param {object} docData
 * @returns {object}
 */
export function mapEventDocToUi(docData = {}) {
  const date = normalizeDateValue(docData.date)
  const startTime = docData.startTime
    ? normalizeTimeValue(docData.startTime)
    : ''
  const endTime = docData.endTime ? normalizeTimeValue(docData.endTime) : ''
  const legacyTime = normalizeTimeValue(docData.time)

  return {
    id: docData.id,
    title: normalizeText(docData.title),
    category: normalizeText(docData.category),
    date,
    dateKey: date ? toDateKey(date) : '',
    startTime,
    endTime,
    time: startTime || legacyTime,
    description: normalizeText(docData.description),
    source: normalizeText(docData.source) || EVENT_SOURCES.MANUAL,
    relatedRecordId: docData.relatedRecordId ?? null,
    createdAt: docData.createdAt ?? null,
    updatedAt: docData.updatedAt ?? null,
  }
}

function validateManualEventPayload(data) {
  if (!data || typeof data !== 'object') {
    throw new Error(MESSAGES.ERROR.EVENT_REQUIRED_FIELDS)
  }

  const title = normalizeText(data.title)
  const category = normalizeText(data.category)
  const date = normalizeDateValue(data.date)
  const startTime = normalizeText(data.startTime)
  const endTime = normalizeText(data.endTime)

  if (!title || !category || !date || !startTime || !endTime) {
    throw new Error(MESSAGES.ERROR.EVENT_REQUIRED_FIELDS)
  }

  if (!isValidTimeRange(startTime, endTime)) {
    throw new Error(MESSAGES.ERROR.EVENT_END_TIME_INVALID)
  }
}

function isValidTimeRange(startTime, endTime) {
  const start = parseTimeMinutes(startTime)
  const end = parseTimeMinutes(endTime)
  if (start < 0 || end < 0) return false
  return end > start
}

function parseTimeMinutes(time24) {
  const raw = normalizeText(time24)
  if (!raw) return -1
  const match = raw.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return -1
  return Number(match[1]) * 60 + Number(match[2])
}

function isEventConflictError(error) {
  return (
    error instanceof Error &&
    error.message.startsWith("This event overlaps with '")
  )
}

function buildEventDocument(data = {}) {
  const startTime = normalizeText(data.startTime)
  const endTime = normalizeText(data.endTime)

  return {
    title: normalizeText(data.title),
    category: normalizeText(data.category),
    date: normalizeDateValue(data.date),
    startTime,
    endTime,
    time: startTime || normalizeTimeValue(data.time),
    description: normalizeText(data.description),
    source: normalizeText(data.source) || EVENT_SOURCES.MANUAL,
    relatedRecordId: data.relatedRecordId ?? null,
  }
}

/**
 * Fetch all parish events, ordered by date.
 *
 * @returns {Promise<object[]>}
 */
export async function getEvents() {
  try {
    const eventsQuery = query(
      eventsCollectionRef,
      orderBy(EVENT_FIELDS.DATE, 'asc'),
    )
    const snapshot = await getDocs(eventsQuery)

    return snapshot.docs
      .map((docSnap) =>
        mapEventDocToUi({
          id: docSnap.id,
          ...docSnap.data(),
        }),
      )
      .sort((a, b) => {
        const byDate = String(a.dateKey).localeCompare(String(b.dateKey))
        if (byDate !== 0) return byDate
        return String(a.startTime || a.time).localeCompare(
          String(b.startTime || b.time),
        )
      })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : MESSAGES.ERROR.UNKNOWN
    throw new Error(`${MESSAGES.ERROR.EVENT_FETCH} ${message}`)
  }
}

/**
 * Fetch events for a specific calendar day.
 *
 * @param {Date|string} date
 * @returns {Promise<object[]>}
 */
export async function getEventsByDate(date) {
  const target = normalizeDateValue(date)
  if (!target) return []

  const events = await getEvents()
  const key = toDateKey(target)

  return events
    .filter((event) => event.dateKey === key)
    .sort((a, b) =>
      String(a.startTime || a.time).localeCompare(String(b.startTime || b.time)),
    )
}

/**
 * Finds an existing manual event that overlaps the requested time range.
 * Sacramental records are intentionally excluded.
 *
 * @param {object} params
 * @param {Date|string} params.date
 * @param {string} params.startTime
 * @param {string} params.endTime
 * @param {string} [params.excludeId]
 * @returns {Promise<object|null>}
 */
async function findOverlappingManualEvent({
  date,
  startTime,
  endTime,
  excludeId,
}) {
  const eventDate = normalizeDateValue(date)
  if (!eventDate || !startTime || !endTime) return null

  const events = await getEventsByDate(eventDate)

  return events.find((event) => {
    if (!isManualEvent(event)) return false
    if (excludeId && event.id === excludeId) return false

    return timesOverlap(
      startTime,
      endTime,
      event.startTime,
      event.endTime,
    )
  })
}

/**
 * Create a manual parish event.
 *
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function createEvent(data) {
  try {
    validateManualEventPayload(data)

    const overlap = await findOverlappingManualEvent({
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
    })
    if (overlap) {
      throw new Error(formatEventConflictMessage(overlap))
    }

    const payload = {
      ...buildEventDocument({
        ...data,
        source: EVENT_SOURCES.MANUAL,
        relatedRecordId: null,
      }),
      source: EVENT_SOURCES.MANUAL,
      relatedRecordId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(eventsCollectionRef, payload)

    return mapEventDocToUi({
      id: docRef.id,
      ...payload,
    })
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === MESSAGES.ERROR.EVENT_REQUIRED_FIELDS ||
        error.message === MESSAGES.ERROR.EVENT_END_TIME_INVALID ||
        isEventConflictError(error))
    ) {
      throw error
    }

    const message =
      error instanceof Error ? error.message : MESSAGES.ERROR.UNKNOWN
    throw new Error(`${MESSAGES.ERROR.EVENT_CREATE} ${message}`)
  }
}

/**
 * Update a manual parish event.
 *
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function updateEvent(id, data) {
  try {
    if (!id) {
      throw new Error('Event id is required.')
    }

    validateManualEventPayload(data)

    const overlap = await findOverlappingManualEvent({
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      excludeId: id,
    })
    if (overlap) {
      throw new Error(formatEventConflictMessage(overlap))
    }

    const payload = {
      ...buildEventDocument({
        ...data,
        source: EVENT_SOURCES.MANUAL,
        relatedRecordId: null,
      }),
      source: EVENT_SOURCES.MANUAL,
      relatedRecordId: null,
      updatedAt: serverTimestamp(),
    }

    await updateDoc(doc(db, COLLECTIONS.EVENTS, id), payload)

    return mapEventDocToUi({
      id,
      ...payload,
    })
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === MESSAGES.ERROR.EVENT_REQUIRED_FIELDS ||
        error.message === MESSAGES.ERROR.EVENT_END_TIME_INVALID ||
        error.message.includes('id is required') ||
        isEventConflictError(error))
    ) {
      throw error
    }

    const message =
      error instanceof Error ? error.message : MESSAGES.ERROR.UNKNOWN
    throw new Error(`${MESSAGES.ERROR.EVENT_UPDATE} ${message}`)
  }
}

/**
 * Delete a manual parish event.
 *
 * @param {string} id
 * @param {object} [event]
 * @returns {Promise<void>}
 */
export async function deleteEvent(id, event) {
  try {
    if (!id) {
      throw new Error('Event id is required.')
    }

    if (event && !isManualEvent(event)) {
      throw new Error(MESSAGES.ERROR.EVENT_SACRAMENTAL_LOCKED)
    }

    if (!event) {
      const existingSnap = await getDoc(doc(db, COLLECTIONS.EVENTS, id))
      if (existingSnap.exists()) {
        const existing = { id: existingSnap.id, ...existingSnap.data() }
        if (!isManualEvent(existing)) {
          throw new Error(MESSAGES.ERROR.EVENT_SACRAMENTAL_LOCKED)
        }
      }
    }

    await deleteDoc(doc(db, COLLECTIONS.EVENTS, id))
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === MESSAGES.ERROR.EVENT_SACRAMENTAL_LOCKED ||
        error.message.includes('id is required'))
    ) {
      throw error
    }

    const message =
      error instanceof Error ? error.message : MESSAGES.ERROR.UNKNOWN
    throw new Error(`${MESSAGES.ERROR.EVENT_DELETE} ${message}`)
  }
}

async function findEventsByRelatedRecord(relatedRecordId, source) {
  const linkedQuery = query(
    eventsCollectionRef,
    where(EVENT_FIELDS.RELATED_RECORD_ID, '==', relatedRecordId),
  )

  const snapshot = await getDocs(linkedQuery)
  return snapshot.docs.filter((docSnap) => {
    if (!source) return true
    return docSnap.data()?.source === source
  })
}

/**
 * Creates or updates the calendar event linked to a sacramental record.
 *
 * @param {object} params
 * @param {string} params.source
 * @param {string} params.relatedRecordId
 * @param {string} params.title
 * @param {Date|string} params.date
 * @param {string} [params.time]
 * @param {string} [params.description]
 * @returns {Promise<object|null>}
 */
export async function syncSacramentalEvent({
  source,
  relatedRecordId,
  title,
  date,
  time = DEFAULT_SACRAMENTAL_TIME,
  description = '',
}) {
  if (!source || !relatedRecordId) return null

  const category = SACRAMENTAL_CATEGORY_LABELS[source] || normalizeText(source)
  const eventDate = normalizeDateValue(date)
  if (!eventDate) return null

  const payload = {
    title: normalizeText(title) || category,
    category,
    date: eventDate,
    time: normalizeTimeValue(time),
    description: normalizeText(description),
    source,
    relatedRecordId,
    updatedAt: serverTimestamp(),
  }

  const existing = await findEventsByRelatedRecord(relatedRecordId, source)

  if (existing.length === 0) {
    const docRef = await addDoc(eventsCollectionRef, {
      ...payload,
      createdAt: serverTimestamp(),
    })

    return mapEventDocToUi({
      id: docRef.id,
      ...payload,
    })
  }

  const [primary, ...duplicates] = existing
  await updateDoc(primary.ref, payload)

  // Clean up accidental duplicates so records never leave orphaned events.
  await Promise.all(duplicates.map((item) => deleteDoc(item.ref)))

  return mapEventDocToUi({
    id: primary.id,
    ...payload,
  })
}

/**
 * Removes all calendar events linked to a sacramental record.
 *
 * @param {string} relatedRecordId
 * @param {string} source
 * @returns {Promise<void>}
 */
export async function deleteEventsByRelatedRecord(relatedRecordId, source) {
  if (!relatedRecordId || !source) return

  const existing = await findEventsByRelatedRecord(relatedRecordId, source)
  await Promise.all(existing.map((item) => deleteDoc(item.ref)))
}
