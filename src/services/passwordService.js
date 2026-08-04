import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { COLLECTIONS, MESSAGES } from '../constants'
import { createAuditLog } from './auditLogService'

const SPECIAL_CHAR_PATTERN = /[^A-Za-z0-9]/

/**
 * Validate change-password form fields.
 * @returns {Record<string, string>}
 */
export function validatePasswordChange(form) {
  const errors = {}
  const currentPassword = String(form.currentPassword || '')
  const newPassword = String(form.newPassword || '')
  const confirmPassword = String(form.confirmPassword || '')

  if (!currentPassword.trim()) {
    errors.currentPassword = MESSAGES.ERROR.PASSWORD_CURRENT_REQUIRED
  }

  if (!newPassword) {
    errors.newPassword = MESSAGES.ERROR.PASSWORD_NEW_REQUIRED
  } else {
    const strengthIssues = []
    if (newPassword.length < 8) {
      strengthIssues.push('at least 8 characters')
    }
    if (!/[A-Z]/.test(newPassword)) {
      strengthIssues.push('an uppercase letter')
    }
    if (!/[a-z]/.test(newPassword)) {
      strengthIssues.push('a lowercase letter')
    }
    if (!/[0-9]/.test(newPassword)) {
      strengthIssues.push('a number')
    }
    if (!SPECIAL_CHAR_PATTERN.test(newPassword)) {
      strengthIssues.push('a special character')
    }
    if (strengthIssues.length > 0) {
      errors.newPassword = `Password must include ${strengthIssues.join(', ')}.`
    } else if (currentPassword && newPassword === currentPassword) {
      errors.newPassword = MESSAGES.ERROR.PASSWORD_SAME_AS_CURRENT
    }
  }

  if (!confirmPassword) {
    errors.confirmPassword = MESSAGES.ERROR.PASSWORD_CONFIRM_REQUIRED
  } else if (newPassword && confirmPassword !== newPassword) {
    errors.confirmPassword = MESSAGES.ERROR.PASSWORD_MISMATCH
  }

  return errors
}

function mapPasswordAuthError(error) {
  const code = error?.code || ''
  if (
    code === 'auth/wrong-password' ||
    code === 'auth/invalid-credential' ||
    code === 'auth/invalid-login-credentials'
  ) {
    return MESSAGES.ERROR.PASSWORD_CURRENT_INCORRECT
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Please try again later.'
  }
  if (code === 'auth/weak-password') {
    return MESSAGES.ERROR.PASSWORD_WEAK
  }
  if (code === 'auth/requires-recent-login') {
    return MESSAGES.ERROR.PASSWORD_CURRENT_INCORRECT
  }
  return MESSAGES.ERROR.PASSWORD_UPDATE
}

/**
 * Re-authenticate, update Firebase Auth password, and write an audit log.
 * Never stores passwords in Firestore.
 */
export async function changeUserPassword({
  currentPassword,
  newPassword,
  confirmPassword,
} = {}) {
  const fieldErrors = validatePasswordChange({
    currentPassword,
    newPassword,
    confirmPassword,
  })
  if (Object.keys(fieldErrors).length > 0) {
    const error = new Error(MESSAGES.ERROR.PASSWORD_VALIDATION)
    error.fieldErrors = fieldErrors
    throw error
  }

  const user = auth.currentUser
  if (!user?.email || !user.uid) {
    throw new Error(MESSAGES.ERROR.PASSWORD_UPDATE)
  }

  try {
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword,
    )
    await reauthenticateWithCredential(user, credential)
  } catch (error) {
    if (error?.fieldErrors) throw error
    const message = mapPasswordAuthError(error)
    const authError = new Error(message)
    if (message === MESSAGES.ERROR.PASSWORD_CURRENT_INCORRECT) {
      authError.fieldErrors = { currentPassword: message }
    }
    throw authError
  }

  try {
    await updatePassword(user, newPassword)
  } catch (error) {
    throw new Error(mapPasswordAuthError(error))
  }

  try {
    await setDoc(
      doc(db, COLLECTIONS.USERS, user.uid),
      {
        lastPasswordChange: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  } catch (error) {
    console.error('Failed to update lastPasswordChange:', error)
  }

  await createAuditLog({
    action: 'Changed Password',
    module: 'Profile',
    performedBy: user.email,
    performedByUid: user.uid,
  })

  return true
}
