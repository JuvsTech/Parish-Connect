/**
 * Parish event sources and categories for the calendar system.
 */

export const EVENT_SOURCES = {
  MANUAL: 'manual',
  BAPTISM: 'baptism',
  CONFIRMATION: 'confirmation',
  MARRIAGE: 'marriage',
  DEATH: 'death',
  CONVERSION: 'conversion',
  MASS_INTENTION: 'massIntention',
}

export const SACRAMENTAL_SOURCES = [
  EVENT_SOURCES.BAPTISM,
  EVENT_SOURCES.CONFIRMATION,
  EVENT_SOURCES.MARRIAGE,
  EVENT_SOURCES.DEATH,
  EVENT_SOURCES.CONVERSION,
  EVENT_SOURCES.MASS_INTENTION,
]

/**
 * Manual Event Title options for Add/Edit Event.
 * Sacramental titles (Baptism, Confirmation, Marriage, Death, Conversion) are excluded —
 * those are created automatically from records.
 */
export const MANUAL_EVENT_TITLES = [
  'Batch Baptism',
  'Holy Mass',
  'Parish Meeting',
  'Seminar',
  'Fiesta',
  'Novena',
  'Procession',
  'Wedding Rehearsal',
  'Funeral Service',
  'Others',
]

/** @deprecated Use MANUAL_EVENT_TITLES */
export const MANUAL_EVENT_CATEGORIES = MANUAL_EVENT_TITLES

export const OTHER_EVENT_TITLE = 'Others'

/** Display labels for sacramental categories. */
export const SACRAMENTAL_CATEGORY_LABELS = {
  [EVENT_SOURCES.BAPTISM]: 'Baptism',
  [EVENT_SOURCES.CONFIRMATION]: 'Confirmation',
  [EVENT_SOURCES.MARRIAGE]: 'Marriage',
  [EVENT_SOURCES.DEATH]: 'Death',
  [EVENT_SOURCES.CONVERSION]: 'Conversion',
  [EVENT_SOURCES.MASS_INTENTION]: 'Mass Intention',
}

export function isManualEvent(event) {
  return event?.source === EVENT_SOURCES.MANUAL
}

export function isSacramentalEvent(event) {
  return SACRAMENTAL_SOURCES.includes(event?.source)
}
