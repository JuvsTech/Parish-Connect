/** Normalize empty / placeholder values for record detail views. */
export function displayValue(value) {
  if (value === null || value === undefined) return '—'
  const text = String(value).trim()
  if (!text || text === '-' || text.toLowerCase() === 'n/a') return '—'
  return text
}
