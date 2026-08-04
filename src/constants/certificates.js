/**
 * Official certificate identity — aligned with docs/certificate-templates/
 * and the approved Parish Connect digital certificate design.
 */

export const CERTIFICATE_DIOCESE =
  'The Roman Catholic Diocese of Alaminos'

export const CERTIFICATE_PARISH_NAME =
  'Immaculate Conception of the Virgin Mary Parish'

export const CERTIFICATE_PARISH_ADDRESS = '2407 Bani, Pangasinan'

/** Attestation parish name used across official DOCX templates. */
export const CERTIFICATE_RECORD_PARISH =
  'Our Lady of the Immaculate Conception Parish'

/** @deprecated Use CERTIFICATE_RECORD_PARISH */
export const CERTIFICATE_BAPTISM_RECORD_PARISH = CERTIFICATE_RECORD_PARISH

/** Confirmation DOCX: parish church where confirmation was received. */
export const CERTIFICATE_CONFIRMATION_PARISH_CHURCH =
  'Our Lady of the Immaculate Conception'

export const CERTIFICATE_TYPES = {
  BAPTISM: 'baptism',
  CONFIRMATION: 'confirmation',
  MARRIAGE: 'marriage',
  DEATH: 'death',
}

export const CERTIFICATE_TITLES = {
  baptism: 'Certificate of Baptism',
  confirmation: 'Certificate of Confirmation',
  marriage: 'Certificate of Marriage',
  death: 'Certificate of Death',
}

/** Sacraments with live certificate generators. */
export const CERTIFICATE_IMPLEMENTED = new Set([
  CERTIFICATE_TYPES.BAPTISM,
  CERTIFICATE_TYPES.CONFIRMATION,
  CERTIFICATE_TYPES.MARRIAGE,
  CERTIFICATE_TYPES.DEATH,
])

/**
 * Lightweight check — safe to import without pulling PDF / certificate runtime.
 * @param {string} sacrament
 * @returns {boolean}
 */
export function isCertificateImplemented(sacrament) {
  return CERTIFICATE_IMPLEMENTED.has(sacrament)
}
