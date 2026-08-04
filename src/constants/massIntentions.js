/**
 * Mass Intention module constants.
 */

export const MASS_INTENTION_TYPE_OPTIONS = [
  'Soul of the Deceased',
  'Thanksgiving',
  'Healing',
  'Birthday',
  'Wedding Anniversary',
  'Death Anniversary',
  'Special Intention',
  'Others',
]

export const MASS_INTENTION_OTHER_TYPE = 'Others'

export const MASS_INTENTION_STATUS = {
  PENDING: 'Pending',
  SCHEDULED: 'Scheduled',
  OFFERED: 'Offered',
  CANCELLED: 'Cancelled',
}

export const MASS_INTENTION_STATUS_OPTIONS = [
  MASS_INTENTION_STATUS.PENDING,
  MASS_INTENTION_STATUS.SCHEDULED,
  MASS_INTENTION_STATUS.OFFERED,
  MASS_INTENTION_STATUS.CANCELLED,
]

export const DEFAULT_MASS_INTENTION_STATUS = MASS_INTENTION_STATUS.PENDING

export const MASS_INTENTION_PAGE_SIZE = 10

/** Recipient / "Offered For" types (Firestore values). */
export const MASS_INTENTION_RECIPIENT_TYPE = {
  INDIVIDUAL: 'individual',
  COUPLE: 'couple',
  FAMILY: 'family',
  ORGANIZATION: 'organization',
  OTHER: 'other',
}

export const MASS_INTENTION_RECIPIENT_TYPE_OPTIONS = [
  {
    value: MASS_INTENTION_RECIPIENT_TYPE.INDIVIDUAL,
    label: 'Individual',
  },
  {
    value: MASS_INTENTION_RECIPIENT_TYPE.COUPLE,
    label: 'Couple',
  },
  {
    value: MASS_INTENTION_RECIPIENT_TYPE.FAMILY,
    label: 'Family',
  },
  {
    value: MASS_INTENTION_RECIPIENT_TYPE.ORGANIZATION,
    label: 'Organization / Ministry',
  },
  {
    value: MASS_INTENTION_RECIPIENT_TYPE.OTHER,
    label: 'Others',
  },
]

export const DEFAULT_MASS_INTENTION_RECIPIENT_TYPE =
  MASS_INTENTION_RECIPIENT_TYPE.INDIVIDUAL

export const MASS_INTENTION_RECIPIENT_TYPE_VALUES =
  MASS_INTENTION_RECIPIENT_TYPE_OPTIONS.map((item) => item.value)

const { INDIVIDUAL, COUPLE, FAMILY, ORGANIZATION, OTHER } =
  MASS_INTENTION_RECIPIENT_TYPE

/**
 * Intention Type → allowed Recipient Types (parish business rules).
 */
export const MASS_INTENTION_RECIPIENT_RULES = {
  'Soul of the Deceased': [INDIVIDUAL, OTHER],
  Thanksgiving: [INDIVIDUAL, COUPLE, FAMILY, ORGANIZATION, OTHER],
  Healing: [INDIVIDUAL, COUPLE, FAMILY, ORGANIZATION, OTHER],
  Birthday: [INDIVIDUAL, FAMILY],
  'Wedding Anniversary': [COUPLE],
  'Death Anniversary': [INDIVIDUAL, OTHER],
  'Special Intention': [INDIVIDUAL, COUPLE, FAMILY, ORGANIZATION, OTHER],
  Others: [INDIVIDUAL, COUPLE, FAMILY, ORGANIZATION, OTHER],
}

/**
 * @param {string} intentionType
 * @returns {string[]}
 */
export function getAllowedRecipientTypes(intentionType) {
  const key = String(intentionType || '').trim()
  if (!key) return [...MASS_INTENTION_RECIPIENT_TYPE_VALUES]
  return MASS_INTENTION_RECIPIENT_RULES[key]
    ? [...MASS_INTENTION_RECIPIENT_RULES[key]]
    : [...MASS_INTENTION_RECIPIENT_TYPE_VALUES]
}

/**
 * @param {string} intentionType
 * @param {string} recipientType
 * @returns {boolean}
 */
export function isRecipientTypeAllowed(intentionType, recipientType) {
  const type = String(recipientType || '').trim().toLowerCase()
  if (!type) return false
  return getAllowedRecipientTypes(intentionType).includes(type)
}

/**
 * Returns the current recipient type if still allowed; otherwise the first valid option.
 *
 * @param {string} intentionType
 * @param {string} recipientType
 * @returns {string}
 */
export function resolveAllowedRecipientType(intentionType, recipientType) {
  const allowed = getAllowedRecipientTypes(intentionType)
  const current = String(recipientType || '').trim().toLowerCase()
  if (current && allowed.includes(current)) return current
  return allowed[0] || DEFAULT_MASS_INTENTION_RECIPIENT_TYPE
}

/**
 * @param {string} intentionType
 * @returns {{ value: string, label: string }[]}
 */
export function getAllowedRecipientTypeOptions(intentionType) {
  const allowed = new Set(getAllowedRecipientTypes(intentionType))
  return MASS_INTENTION_RECIPIENT_TYPE_OPTIONS.filter((option) =>
    allowed.has(option.value),
  )
}

const EMPTY_COUPLE_FIELDS = {
  spouse1FirstName: '',
  spouse1MiddleName: '',
  spouse1LastName: '',
  spouse1Suffix: '',
  spouse2FirstName: '',
  spouse2MiddleName: '',
  spouse2LastName: '',
  spouse2Suffix: '',
}

/**
 * Keeps fields for the active recipient type; clears all others.
 *
 * @param {object} form
 * @param {string} recipientType
 * @returns {object}
 */
export function applyRecipientTypeFields(form = {}, recipientType) {
  const type =
    String(recipientType || '').trim().toLowerCase() ||
    DEFAULT_MASS_INTENTION_RECIPIENT_TYPE

  const isIndividual = type === INDIVIDUAL
  const isCouple = type === COUPLE
  const isFamily = type === FAMILY
  const isOrganization = type === ORGANIZATION
  const isOther = type === OTHER

  return {
    ...form,
    recipientType: type,
    recipientFirstName: isIndividual
      ? String(form.recipientFirstName || '')
      : '',
    recipientMiddleName: isIndividual
      ? String(form.recipientMiddleName || '')
      : '',
    recipientLastName: isIndividual
      ? String(form.recipientLastName || '')
      : '',
    recipientSuffix: isIndividual ? String(form.recipientSuffix || '') : '',
    spouse1FirstName: isCouple ? String(form.spouse1FirstName || '') : '',
    spouse1MiddleName: isCouple ? String(form.spouse1MiddleName || '') : '',
    spouse1LastName: isCouple ? String(form.spouse1LastName || '') : '',
    spouse1Suffix: isCouple ? String(form.spouse1Suffix || '') : '',
    spouse2FirstName: isCouple ? String(form.spouse2FirstName || '') : '',
    spouse2MiddleName: isCouple ? String(form.spouse2MiddleName || '') : '',
    spouse2LastName: isCouple ? String(form.spouse2LastName || '') : '',
    spouse2Suffix: isCouple ? String(form.spouse2Suffix || '') : '',
    familyName: isFamily ? String(form.familyName || '') : '',
    organizationName: isOrganization
      ? String(form.organizationName || '')
      : '',
    offeredForDescription: isOther
      ? String(form.offeredForDescription || '')
      : '',
  }
}

/**
 * Resolves a valid recipient type for the intention type and clears inactive fields.
 *
 * @param {object} form
 * @param {string} [intentionType]
 * @returns {object}
 */
export function syncFormRecipientForIntentionType(form = {}, intentionType) {
  const nextType = resolveAllowedRecipientType(
    intentionType ?? form.intentionType,
    form.recipientType,
  )
  return applyRecipientTypeFields(
    {
      ...form,
      intentionType:
        intentionType !== undefined ? intentionType : form.intentionType,
    },
    nextType,
  )
}

export { EMPTY_COUPLE_FIELDS }
