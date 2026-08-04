/**
 * Shared record / entity status values.
 */
export const ACTIVE = 'active'
export const ARCHIVED = 'archived'
export const INACTIVE = 'inactive'
export const RETIRED = 'retired'

/** Sacramental record lifecycle */
export const SCHEDULED = 'scheduled'
export const COMPLETED = 'completed'
export const CANCELLED = 'cancelled'

export const STATUS = {
  ACTIVE,
  ARCHIVED,
  INACTIVE,
  RETIRED,
  SCHEDULED,
  COMPLETED,
  CANCELLED,
}

export const RECORD_STATUS_OPTIONS = [
  { value: SCHEDULED, label: 'Scheduled' },
  { value: COMPLETED, label: 'Completed' },
  { value: CANCELLED, label: 'Cancelled' },
]

/** Minister lifecycle (Manage Ministers). */
export const MINISTER_STATUS_OPTIONS = [
  { value: ACTIVE, label: 'Active' },
  { value: RETIRED, label: 'Retired' },
  { value: INACTIVE, label: 'Inactive' },
]

/** Normalize legacy and display statuses into minister lifecycle values. */
export function normalizeMinisterStatus(status) {
  const raw = String(status || '').trim().toLowerCase()
  if (!raw) return ACTIVE
  if (raw === RETIRED) return RETIRED
  if (raw === INACTIVE || raw === ARCHIVED) return INACTIVE
  if (raw === ACTIVE) return ACTIVE
  return ACTIVE
}

export function ministerStatusLabel(status) {
  const normalized = normalizeMinisterStatus(status)
  return (
    MINISTER_STATUS_OPTIONS.find((item) => item.value === normalized)?.label ||
    'Active'
  )
}

/** Only Active ministers may be assigned to new sacramental records. */
export function isMinisterAssignable(status) {
  return normalizeMinisterStatus(status) === ACTIVE
}

/** Normalize legacy active/archived into the new lifecycle. */
export function normalizeRecordStatus(status) {
  if (status === COMPLETED || status === SCHEDULED || status === CANCELLED) {
    return status
  }
  if (status === ARCHIVED || status === CANCELLED) return CANCELLED
  if (status === ACTIVE) return COMPLETED
  return SCHEDULED
}

export function recordStatusLabel(status) {
  const normalized = normalizeRecordStatus(status)
  return (
    RECORD_STATUS_OPTIONS.find((item) => item.value === normalized)?.label ||
    'Scheduled'
  )
}
