import {
  collection,
  getCountFromServer,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { COLLECTIONS, MESSAGES } from '../constants'

async function countRecords(collectionName) {
  try {
    const snapshot = await getCountFromServer(collection(db, collectionName))
    return snapshot.data().count || 0
  } catch {
    return 0
  }
}

/**
 * Loads compact sacramental record counts for the Dashboard summary.
 *
 * @returns {Promise<{ baptism: number, confirmation: number, marriage: number, death: number, conversion: number, massIntention: number }>}
 */
export async function getSacramentalRecordCounts() {
  try {
    const [baptism, confirmation, marriage, death, conversion, massIntention] =
      await Promise.all([
        countRecords(COLLECTIONS.BAPTISM),
        countRecords(COLLECTIONS.CONFIRMATION),
        countRecords(COLLECTIONS.MARRIAGE),
        countRecords(COLLECTIONS.DEATH),
        countRecords(COLLECTIONS.CONVERSION),
        countRecords(COLLECTIONS.MASS_INTENTIONS),
      ])

    return {
      baptism,
      confirmation,
      marriage,
      death,
      conversion,
      massIntention,
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : MESSAGES.ERROR.UNKNOWN
    throw new Error(`${MESSAGES.ERROR.DASHBOARD_LOAD} ${message}`)
  }
}
