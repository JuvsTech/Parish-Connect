import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { COLLECTIONS } from '../constants'

/**
 * Write an audit log entry. Failures are swallowed so the primary action
 * (profile update / password change) is not blocked.
 */
export async function createAuditLog({
  action,
  module = 'Profile',
  performedBy,
  performedByUid,
  details = null,
} = {}) {
  const user = auth.currentUser
  const entry = {
    action: String(action || '').trim(),
    module: String(module || 'Profile').trim(),
    performedBy: String(
      performedBy || user?.email || user?.uid || 'Unknown',
    ).trim(),
    performedByUid: String(performedByUid || user?.uid || '').trim(),
    timestamp: serverTimestamp(),
  }

  if (details != null && details !== '') {
    entry.details = details
  }

  if (!entry.action) return null

  try {
    return await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), entry)
  } catch (error) {
    console.error('Failed to write audit log:', error)
    return null
  }
}
