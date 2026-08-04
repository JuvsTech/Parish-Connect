/**
 * Composes a display name from separate name parts.
 * Order: First Middle Last Suffix
 *
 * @param {{ firstName?: string, middleName?: string, lastName?: string, suffix?: string }} parts
 * @returns {string}
 */
export function formatPersonName(parts = {}) {
  const firstName = String(parts.firstName ?? '').trim()
  const middleName = String(parts.middleName ?? '').trim()
  const lastName = String(parts.lastName ?? '').trim()
  const suffix = String(parts.suffix ?? '').trim()

  const nameCore = [firstName, middleName, lastName].filter(Boolean).join(' ')
  const composed = [nameCore, suffix].filter(Boolean).join(' ')

  return composed || '—'
}

/**
 * Child display name from Firestore name parts.
 */
export function getChildDisplayName(record = {}) {
  return formatPersonName({
    firstName: record.childFirstName,
    middleName: record.childMiddleName,
    lastName: record.childLastName,
    suffix: record.childSuffix,
  })
}

/**
 * Confirmand display name from Confirmation registry name parts.
 */
export function getConfirmandDisplayName(record = {}) {
  return formatPersonName({
    firstName: record.confirmandFirstName,
    middleName: record.confirmandMiddleName,
    lastName: record.confirmandLastName,
    suffix: record.confirmandSuffix,
  })
}

/**
 * Groom display name from Marriage registry name parts.
 */
export function getGroomDisplayName(record = {}) {
  return formatPersonName({
    firstName: record.groomFirstName,
    middleName: record.groomMiddleName,
    lastName: record.groomLastName,
    suffix: record.groomSuffix,
  })
}

/**
 * Bride display name from Marriage registry name parts.
 */
export function getBrideDisplayName(record = {}) {
  return formatPersonName({
    firstName: record.brideFirstName,
    middleName: record.brideMiddleName,
    lastName: record.brideLastName,
    suffix: record.brideSuffix,
  })
}

/**
 * Deceased display name from Death registry name parts.
 */
export function getDeceasedDisplayName(record = {}) {
  return formatPersonName({
    firstName: record.firstName ?? record.deceasedFirstName,
    middleName: record.middleName ?? record.deceasedMiddleName,
    lastName: record.lastName ?? record.deceasedLastName,
    suffix: record.suffix ?? record.deceasedSuffix,
  })
}

/**
 * Related person display name from Death family information fields.
 */
export function getRelatedPersonDisplayName(record = {}) {
  return formatPersonName({
    firstName: record.relatedPersonFirstName,
    middleName: record.relatedPersonMiddleName,
    lastName: record.relatedPersonLastName,
    suffix: record.relatedPersonSuffix,
  })
}

/**
 * Formats structured residence fields for display/search.
 */
export function formatDeathResidence(record = {}) {
  return [record.barangay, record.municipality, record.province]
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(', ')
}

/**
 * Convert (Liber Conversionum) display name from name parts.
 */
export function getConvertDisplayName(record = {}) {
  return formatPersonName({
    firstName: record.firstName,
    middleName: record.middleName,
    lastName: record.lastName,
    suffix: record.suffix,
  })
}

/**
 * Formats conversion residence including optional street address.
 */
export function formatConversionResidence(record = {}) {
  return [record.barangay, record.municipality, record.province]
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(', ')
}

function splitLegacyFullName(legacy) {
  const value = String(legacy || '').trim()
  if (!value) {
    return { firstName: '', middleName: '', lastName: '', suffix: '' }
  }

  const tokens = value.split(/\s+/).filter(Boolean)
  if (tokens.length === 1) {
    return {
      firstName: tokens[0],
      middleName: '',
      lastName: tokens[0],
      suffix: '',
    }
  }

  return {
    firstName: tokens[0],
    middleName: tokens.slice(1, -1).join(' '),
    lastName: tokens[tokens.length - 1],
    suffix: '',
  }
}

function readStructuredNameParts(record, prefix) {
  const firstName = String(record[`${prefix}FirstName`] || '').trim()
  const middleName = String(record[`${prefix}MiddleName`] || '').trim()
  const lastName = String(record[`${prefix}LastName`] || '').trim()
  const suffix = String(record[`${prefix}Suffix`] || '').trim()
  if (firstName || middleName || lastName || suffix) {
    return { firstName, middleName, lastName, suffix }
  }
  return null
}

/**
 * Male sponsor name parts (Confirmation).
 * Supports structured fields, brief single-sponsor migration fields, and legacy full name.
 */
export function resolveMaleSponsorNameParts(record = {}) {
  return (
    readStructuredNameParts(record, 'maleSponsor') ||
    readStructuredNameParts(record, 'sponsor') ||
    splitLegacyFullName(record.maleSponsor)
  )
}

/**
 * Female sponsor name parts (Confirmation).
 * Supports structured fields and legacy full-name femaleSponsor.
 */
export function resolveFemaleSponsorNameParts(record = {}) {
  return (
    readStructuredNameParts(record, 'femaleSponsor') ||
    splitLegacyFullName(record.femaleSponsor)
  )
}

export function getMaleSponsorDisplayName(record = {}) {
  const parts = resolveMaleSponsorNameParts(record)
  return formatPersonName(parts)
}

export function getFemaleSponsorDisplayName(record = {}) {
  const parts = resolveFemaleSponsorNameParts(record)
  return formatPersonName(parts)
}

/**
 * Combined sponsor display for search / summaries.
 */
export function getSponsorDisplayName(record = {}) {
  const male = getMaleSponsorDisplayName(record)
  const female = getFemaleSponsorDisplayName(record)
  if (male !== '-' && female !== '-') return `${male} / ${female}`
  if (male !== '-') return male
  if (female !== '-') return female
  return '-'
}

/** @deprecated Use resolveMaleSponsorNameParts */
export function resolveSponsorNameParts(record = {}) {
  return resolveMaleSponsorNameParts(record)
}

/**
 * Father display name from Firestore name parts.
 */
export function getFatherDisplayName(record = {}) {
  return formatPersonName({
    firstName: record.fatherFirstName,
    middleName: record.fatherMiddleName,
    lastName: record.fatherLastName,
    suffix: record.fatherSuffix,
  })
}

/**
 * Mother's maiden display name from Firestore name parts.
 */
export function getMotherDisplayName(record = {}) {
  return formatPersonName({
    firstName: record.motherFirstName,
    middleName: record.motherMiddleName,
    lastName: record.motherLastName,
    suffix: record.motherSuffix,
  })
}

/**
 * Godparent display name from name parts.
 */
export function getGodparentDisplayName(godparent = {}) {
  return formatPersonName({
    firstName: godparent.firstName,
    middleName: godparent.middleName,
    lastName: godparent.lastName,
    suffix: godparent.suffix,
  })
}

/**
 * Mass Intention — single "Offered For" display value by recipient type.
 * Supports legacy intention* name fields when recipientType is missing.
 */
export function getOfferedForDisplayName(record = {}) {
  const type = String(record.recipientType || '')
    .trim()
    .toLowerCase()

  if (type === 'couple') {
    const spouse1 = formatPersonName({
      firstName: record.spouse1FirstName || record.person1FirstName,
      middleName: record.spouse1MiddleName || record.person1MiddleName,
      lastName: record.spouse1LastName || record.person1LastName,
      suffix: record.spouse1Suffix || record.person1Suffix,
    })
    const spouse2 = formatPersonName({
      firstName: record.spouse2FirstName || record.person2FirstName,
      middleName: record.spouse2MiddleName || record.person2MiddleName,
      lastName: record.spouse2LastName || record.person2LastName,
      suffix: record.spouse2Suffix || record.person2Suffix,
    })
    if (spouse1 !== '—' && spouse2 !== '—') return `${spouse1} & ${spouse2}`
    if (spouse1 !== '—') return spouse1
    if (spouse2 !== '—') return spouse2
    return '—'
  }
  if (type === 'family') {
    return String(record.familyName || '').trim() || '—'
  }
  if (type === 'organization') {
    return String(record.organizationName || '').trim() || '—'
  }
  if (type === 'other') {
    return String(record.offeredForDescription || '').trim() || '—'
  }

  // individual (default) + legacy records without recipientType
  return formatPersonName({
    firstName: record.recipientFirstName || record.intentionFirstName,
    middleName: record.recipientMiddleName || record.intentionMiddleName,
    lastName: record.recipientLastName || record.intentionLastName,
    suffix: record.recipientSuffix || record.intentionSuffix,
  })
}

/** @deprecated Prefer getOfferedForDisplayName */
export function getIntentionForDisplayName(record = {}) {
  return getOfferedForDisplayName(record)
}

/**
 * Mass Intention — requester / requested by.
 */
export function getRequesterDisplayName(record = {}) {
  return formatPersonName({
    firstName: record.requesterFirstName,
    middleName: record.requesterMiddleName,
    lastName: record.requesterLastName,
    suffix: record.requesterSuffix,
  })
}

/**
 * Mass Intention residence display (barangay, municipality, province).
 */
export function formatMassIntentionResidence(record = {}) {
  if (String(record.residence || '').trim()) {
    return String(record.residence).trim()
  }
  return [record.barangay, record.municipality, record.province]
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(', ')
}
