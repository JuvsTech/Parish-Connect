import { addDoc, collection, serverTimestamp, getDocs, query, orderBy, limit, startAfter } from 'firebase/firestore'
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

/** Bounded chronological history. Rules restrict reads to active administrators. */
export async function getAuditLogsPage(cursor = null) {
  const constraints = [orderBy('timestamp', 'desc')]
  if (cursor) constraints.push(startAfter(cursor))
  constraints.push(limit(50))
  const snapshot = await getDocs(query(collection(db, COLLECTIONS.AUDIT_LOGS), ...constraints))
  return {
    entries: snapshot.docs.map(item => ({ ...item.data(), id: item.id })),
    cursor: snapshot.docs.at(-1) || null,
    hasMore: snapshot.docs.length === 50,
  }
}
