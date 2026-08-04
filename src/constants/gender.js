/** Canonical gender values stored in Firestore for Parish Connect. */
export const GENDER_OPTIONS = ['Male', 'Female']

/**
 * Normalizes free-text / legacy gender values to Male, Female, or ''.
 * @param {unknown} value
 * @returns {'Male'|'Female'|''}
 */
export function normalizeGender(value) {
  const raw = String(value ?? '').trim().toLowerCase()
  if (raw === 'male' || raw === 'm') return 'Male'
  if (raw === 'female' || raw === 'f') return 'Female'
  return ''
}
