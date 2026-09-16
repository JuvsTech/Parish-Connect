import { collection, doc, getDocs, query, runTransaction, serverTimestamp, where } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { COLLECTIONS } from '../constants'

const ARCHIVE_COLLECTIONS = new Set([
  COLLECTIONS.BAPTISM, COLLECTIONS.CONFIRMATION, COLLECTIONS.MARRIAGE,
  COLLECTIONS.DEATH, COLLECTIONS.CONVERSION,
])

function assertCollection(collectionName) {
  if (!ARCHIVE_COLLECTIONS.has(collectionName)) throw new Error('Invalid sacramental record type.')
}

// Access is deliberately scoped to one mounted archive page and one Auth user.
export function createArchiveAccess(user) {
  let valid = true
  return {
    isValid: () => valid && Boolean(user) && auth.currentUser === user,
    revoke: () => { valid = false },
  }
}

function assertAccess(access) {
  if (!access?.isValid()) throw new Error('Verify your current password to access archived records.')
}

export async function getArchivedRecords(collectionName, access) {
  assertCollection(collectionName)
  assertAccess(access)
  const snapshot = await getDocs(query(collection(db, collectionName), where('archived', '==', true)))
  assertAccess(access)
  return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }))
    .sort((a, b) => Number(b.recordYear || 0) - Number(a.recordYear || 0)
      || Number(b.recordNumber || 0) - Number(a.recordNumber || 0))
}

async function changeArchiveState(collectionName, id, reason, recovering, access) {
  assertCollection(collectionName)
  if (!id) throw new Error('Record id is required.')
  const trimmedReason = String(reason || '').trim()
  if (!trimmedReason) throw new Error(`${recovering ? 'Recovery' : 'Archive'} Reason is required.`)
  const user = auth.currentUser
  if (!user) throw new Error('Sign in to continue.')
  const assertSession = () => {
    if (auth.currentUser !== user) throw new Error('Your account has changed. Please try again.')
    if (recovering) assertAccess(access)
  }
  assertSession()
  const ref = doc(db, collectionName, id)
  await runTransaction(db, async (transaction) => {
    assertSession()
    const snapshot = await transaction.get(ref)
    assertSession()
    if (!snapshot.exists()) throw new Error('Record no longer exists.')
    if ((snapshot.data().archived === true) !== recovering) {
      throw new Error(recovering ? 'Record has already been recovered.' : 'Record is already archived.')
    }
    transaction.update(ref, recovering ? {
      archived: false, recoveredAt: serverTimestamp(), recoveryReason: trimmedReason,
    } : {
      archived: true, archivedAt: serverTimestamp(), archiveReason: trimmedReason,
    })
  })
  return true
}

export function archiveRecord(collectionName, id, reason) {
  return changeArchiveState(collectionName, id, reason, false)
}

export function recoverArchivedRecord(collectionName, id, reason, access) {
  return changeArchiveState(collectionName, id, reason, true, access)
}
