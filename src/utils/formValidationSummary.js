/**
 * Builds a human-readable list of validation issues for form dialogs.
 * Nested objects (e.g. godparents) are flattened into labeled messages.
 *
 * @param {Record<string, unknown>} errors
 * @param {Record<string, string>} fieldLabels
 * @returns {string[]}
 */
export function listValidationMessages(errors = {}, fieldLabels = {}) {
  const messages = []

  Object.entries(errors).forEach(([field, value]) => {
    if (!value) return

    if (typeof value === 'string') {
      const label = fieldLabels[field] || field
      messages.push(`${label}: ${value}`)
      return
    }

    if (field === 'godparents' && typeof value === 'object') {
      Object.values(value).forEach((rowErrors, index) => {
        if (!rowErrors || typeof rowErrors !== 'object') return
        Object.entries(rowErrors).forEach(([rowField, rowMessage]) => {
          if (!rowMessage) return
          const rowLabel =
            fieldLabels[`godparent.${rowField}`] ||
            rowField.replace(/([A-Z])/g, ' $1')
          messages.push(`Godparent ${index + 1} ${rowLabel}: ${rowMessage}`)
        })
      })
      return
    }

    if (field === 'principalSponsors' && typeof value === 'object') {
      Object.values(value).forEach((rowErrors, index) => {
        if (!rowErrors || typeof rowErrors !== 'object') return
        Object.entries(rowErrors).forEach(([rowField, rowMessage]) => {
          if (!rowMessage) return
          const rowLabel =
            fieldLabels[`sponsor.${rowField}`] ||
            rowField.replace(/([A-Z])/g, ' $1')
          messages.push(`Sponsor ${index + 1} ${rowLabel}: ${rowMessage}`)
        })
      })
      return
    }

    if (typeof value === 'object') {
      const label = fieldLabels[field] || field
      messages.push(`${label}: requires attention.`)
    }
  })

  return messages
}
