import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import {
  COLLECTIONS,
  normalizeMinisterAssignments,
  ministerHasAssignment,
  getTitlePositionError,
  normalizeMinisterStatus,
  normalizeMinisterTitle,
  isMinisterAssignable,
  STATUS,
} from '../constants'
import {
  getEmailValidationError,
  getPhoneValidationError,
} from '../utils/validation'
import { toProperCase } from '../utils/textFormatter'

function ministersRef() {
  return collection(db, COLLECTIONS.MINISTERS)
}

function resolveActor(options = {}) {
  return String(
    options.userEmail ||
      options.user?.email ||
      options.createdBy ||
      options.updatedBy ||
      '',
  ).trim()
}

function mapMinister(snapshot) {
  const data = snapshot?.data?.() || {}
  const assignments = normalizeMinisterAssignments(data)
  return {
    id: snapshot?.id || '',
    name: String(data.name || '').trim(),
    title: normalizeMinisterTitle(data.title),
    position: String(data.position || '').trim(),
    assignments,
    // Legacy single-value mirrors for older UI/search consumers.
    parish: assignments[0] || '',
    parishAssignment: assignments.join(', '),
    phone: String(data.phone || '').trim(),
    email: String(data.email || '').trim(),
    status: normalizeMinisterStatus(data.status),
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
    createdBy: String(data.createdBy || '').trim(),
    updatedBy: String(data.updatedBy || '').trim(),
  }
}

function buildMinisterPayload(payload) {
  const name = toProperCase(payload.name)
  const title = normalizeMinisterTitle(payload.title)
  const position = String(payload.position || '').trim()
  const phone = String(payload.phone || '').trim()
  const email = String(payload.email || '').trim()
  const assignments = normalizeMinisterAssignments({
    assignments: payload.assignments,
    parish: payload.parish,
    parishAssignment: payload.parishAssignment,
    assignment: payload.assignment,
  })
  const status = normalizeMinisterStatus(payload.status || STATUS.ACTIVE)

  if (!name) throw new Error('Minister name is required.')
  if (!title) throw new Error('Title is required.')
  if (!position) throw new Error('Position / Role is required.')

  const titlePositionError = getTitlePositionError(title, position)
  if (titlePositionError) throw new Error(titlePositionError)

  if (assignments.length === 0) {
    throw new Error('Select at least one assignment.')
  }

  const phoneError = getPhoneValidationError(phone)
  if (phoneError) throw new Error(phoneError)

  const emailError = getEmailValidationError(email)
  if (emailError) throw new Error(emailError)

  return {
    name,
    title,
    position,
    phone,
    email,
    assignments,
    // Keep legacy fields in sync so older documents remain readable.
    parish: assignments[0],
    parishAssignment: assignments.join(', '),
    status,
  }
}

export function formatMinisterDisplayName(minister) {
  if (!minister) return ''
  const title = normalizeMinisterTitle(minister.title)
  const name = String(minister.name || '').trim()
  if (!name) return ''
  return title ? `${title} ${name}` : name
}

/**
 * @param {{ activeOnly?: boolean, assignment?: string }} [options]
 * When `activeOnly` is true, only Active ministers are returned.
 * When `assignment` is set, only ministers whose normalized assignments
 * include that sacrament are returned (supports legacy single-field docs).
 */
export async function getMinisters({
  activeOnly = false,
  assignment = '',
} = {}) {
  try {
    const snapshot = await getDocs(query(ministersRef(), orderBy('name', 'asc')))
    let ministers = (snapshot?.docs || []).map(mapMinister)

    if (activeOnly) {
      ministers = ministers.filter((item) => isMinisterAssignable(item.status))
    }

    const requiredAssignment = String(assignment || '').trim()
    if (requiredAssignment) {
      ministers = ministers.filter((item) =>
        ministerHasAssignment(item, requiredAssignment),
      )
    }

    return ministers
  } catch (err) {
    // Surface a clean error for UI helpers; never return undefined.
    throw err instanceof Error
      ? err
      : new Error('Unable to load ministers.')
  }
}

/**
 * @param {object} payload
 * @param {{ userEmail?: string, user?: { email?: string }, createdBy?: string }} [options]
 */
export async function createMinister(payload, options = {}) {
  const fields = buildMinisterPayload(payload)
  const actor = resolveActor(options)
  const docRef = await addDoc(ministersRef(), {
    ...fields,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: actor,
    updatedBy: actor,
  })
  return docRef.id
}

/**
 * @param {string} id
 * @param {object} payload
 * @param {{ userEmail?: string, user?: { email?: string }, updatedBy?: string }} [options]
 */
export async function updateMinister(id, payload, options = {}) {
  if (!id) throw new Error('Minister id is required.')
  const fields = buildMinisterPayload(payload)
  const actor = resolveActor(options)
  await updateDoc(doc(db, COLLECTIONS.MINISTERS, id), {
    ...fields,
    updatedAt: serverTimestamp(),
    updatedBy: actor,
  })
}
