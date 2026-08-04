import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { COLLECTIONS, MESSAGES } from '../constants'
import { normalizeGender } from '../constants/gender'
import { getPhoneValidationError } from '../utils/validation'
import { toProperCase } from '../utils/textFormatter'
import { createAuditLog } from './auditLogService'

const ROLE_LABELS = {
  admin: 'Administrator',
  staff: 'Staff',
  administrator: 'Administrator',
}

export function formatUserRoleLabel(role) {
  const key = String(role || '')
    .trim()
    .toLowerCase()
  return ROLE_LABELS[key] || (role ? String(role) : '—')
}

export function formatAccountStatusLabel(status) {
  const value = String(status || 'active').trim()
  if (!value) return 'Active'
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

function toJsDate(value) {
  if (!value) return null
  if (typeof value?.toDate === 'function') {
    const date = value.toDate()
    return Number.isNaN(date.getTime()) ? null : date
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }
  return null
}

export function formatProfileDateTime(value) {
  const date = toJsDate(value)
  if (!date) return '—'
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatProfileDate(value) {
  const date = toJsDate(value)
  if (!date) return '—'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function toBirthdayInputValue(value) {
  const date = toJsDate(value)
  if (!date) {
    const raw = String(value || '').trim()
    return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : ''
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function usersDoc(uid) {
  return doc(db, COLLECTIONS.USERS, uid)
}

/**
 * Load the authenticated user's profile from Firestore.
 */
export async function getUserProfile(uid, authUser = null) {
  if (!uid) throw new Error(MESSAGES.ERROR.PROFILE_LOAD)

  try {
    const snapshot = await getDoc(usersDoc(uid))
    const data = snapshot.exists() ? snapshot.data() || {} : {}

    return {
      uid,
      email: authUser?.email || data.email || '',
      firstName: String(data.firstName || '').trim(),
      middleName: String(data.middleName || '').trim(),
      lastName: String(data.lastName || '').trim(),
      phone: String(data.phone || '').trim(),
      address: String(data.address || '').trim(),
      birthday: toBirthdayInputValue(data.birthday),
      gender: String(data.gender || '').trim(),
      photoURL: String(data.photoURL || '').trim(),
      role: data.role || null,
      status: data.status || 'active',
      createdAt: data.createdAt ?? authUser?.metadata?.creationTime ?? null,
      lastLogin: data.lastLogin ?? null,
      lastPasswordChange: data.lastPasswordChange ?? null,
      displayUserId: String(data.displayUserId || uid).trim(),
    }
  } catch {
    throw new Error(MESSAGES.ERROR.PROFILE_LOAD)
  }
}

/**
 * Validate editable personal fields for Phase 1.
 * @returns {Record<string, string>}
 */
export function validatePersonalProfile(form) {
  const errors = {}
  const firstName = String(form.firstName || '').trim()
  const lastName = String(form.lastName || '').trim()
  const phone = String(form.phone || '').trim()
  const gender = normalizeGender(form.gender)
  const birthday = String(form.birthday || '').trim()

  if (!firstName) errors.firstName = 'First name is required.'
  if (!lastName) errors.lastName = 'Last name is required.'

  if (phone) {
    const phoneError = getPhoneValidationError(phone)
    if (phoneError) errors.phone = phoneError
  }

  if (!gender) {
    errors.gender = 'Gender is required.'
  }

  if (birthday) {
    const date = new Date(`${birthday}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (Number.isNaN(date.getTime())) {
      errors.birthday = 'Please enter a valid birthday.'
    } else if (date > today) {
      errors.birthday = 'Birthday cannot be a future date.'
    }
  }

  return errors
}

/**
 * Save personal profile fields to users/{uid}.
 * Users may only update their own document. Role and email are never written.
 */
export async function updateUserProfile(uid, payload, options = {}) {
  if (!uid) throw new Error(MESSAGES.ERROR.PROFILE_UPDATE)

  const currentUid = auth.currentUser?.uid
  if (!currentUid || currentUid !== uid) {
    throw new Error(MESSAGES.ERROR.PROFILE_FORBIDDEN)
  }

  const errors = validatePersonalProfile(payload)
  if (Object.keys(errors).length > 0) {
    const error = new Error(MESSAGES.ERROR.PROFILE_VALIDATION)
    error.fieldErrors = errors
    throw error
  }

  try {
    const data = {
      firstName: toProperCase(payload.firstName),
      middleName: toProperCase(payload.middleName),
      lastName: toProperCase(payload.lastName),
      phone: String(payload.phone || '').trim(),
      address: String(payload.address || '').trim(),
      birthday: String(payload.birthday || '').trim(),
      gender: normalizeGender(payload.gender),
      updatedAt: serverTimestamp(),
      updatedBy: String(options.userEmail || auth.currentUser?.email || '').trim(),
    }

    await setDoc(usersDoc(uid), data, { merge: true })

    const performedBy = auth.currentUser?.email || uid

    if (options.logPersonalUpdate !== false) {
      await createAuditLog({
        action: 'Updated Profile',
        module: 'Profile',
        performedBy,
        performedByUid: uid,
      })
    }

    return getUserProfile(uid, auth.currentUser)
  } catch (error) {
    if (error?.fieldErrors) throw error
    if (error?.message === MESSAGES.ERROR.PROFILE_FORBIDDEN) throw error
    throw new Error(MESSAGES.ERROR.PROFILE_UPDATE)
  }
}
