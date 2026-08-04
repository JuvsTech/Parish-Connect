/**
 * Standardized documentary requirements per sacrament.
 * Checklist-only (no file uploads). Incomplete never blocks save.
 */

export const SACRAMENT_REQUIREMENTS = {
  baptism: [{ key: 'birthCertificate', label: 'Birth Certificate' }],
  confirmation: [
    { key: 'baptismalCertificate', label: 'Baptismal Certificate' },
  ],
  marriage: [
    { key: 'birthCertificate', label: 'Birth Certificate' },
    { key: 'baptismalCertificate', label: 'Baptismal Certificate' },
    { key: 'confirmationCertificate', label: 'Confirmation Certificate' },
    { key: 'cenomar', label: 'CENOMAR' },
    { key: 'marriageLicense', label: 'Marriage License' },
    { key: 'marriageBanns', label: 'Marriage Banns' },
  ],
  death: [{ key: 'deathCertificate', label: 'Death Certificate' }],
  conversion: [
    { key: 'birthCertificate', label: 'Birth Certificate' },
    { key: 'baptismalCertificate', label: 'Baptismal Certificate' },
  ],
}

/**
 * @param {keyof typeof SACRAMENT_REQUIREMENTS} sacrament
 */
export function getSacramentRequirementOptions(sacrament) {
  return SACRAMENT_REQUIREMENTS[sacrament] || []
}

/**
 * @param {keyof typeof SACRAMENT_REQUIREMENTS} sacrament
 */
export function emptySacramentRequirements(sacrament) {
  return getSacramentRequirementOptions(sacrament).reduce((acc, item) => {
    acc[item.key] = false
    return acc
  }, {})
}

/**
 * @param {keyof typeof SACRAMENT_REQUIREMENTS} sacrament
 * @param {Record<string, boolean>|null|undefined} value
 */
export function normalizeSacramentRequirements(sacrament, value) {
  const empty = emptySacramentRequirements(sacrament)
  if (!value || typeof value !== 'object') return empty
  Object.keys(empty).forEach((key) => {
    empty[key] = Boolean(value[key])
  })
  return empty
}

/**
 * @param {keyof typeof SACRAMENT_REQUIREMENTS} sacrament
 * @param {Record<string, boolean>|null|undefined} requirements
 */
export function getRequirementsSummary(sacrament, requirements) {
  const options = getSacramentRequirementOptions(sacrament)
  const normalized = normalizeSacramentRequirements(sacrament, requirements)
  const total = options.length
  const submitted = options.reduce(
    (count, item) => count + (normalized[item.key] ? 1 : 0),
    0,
  )
  const complete = total > 0 && submitted === total
  const status = complete ? 'complete' : 'incomplete'

  return {
    submitted,
    total,
    ratioLabel: `${submitted} / ${total}`,
    status,
    statusLabel: complete
      ? 'Complete'
      : `Incomplete (${submitted} of ${total} Submitted)`,
    shortStatusLabel: complete ? 'Complete' : 'Incomplete',
    requirements: normalized,
  }
}
