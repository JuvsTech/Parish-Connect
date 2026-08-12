/**
 * Calendar helpers for Dashboard scheduling.
 * Works with eventService UI-mapped events:
 * { id, title, category, date, dateKey, time, source, ... }
 */

export function startOfDay(date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

export function addDays(date, amount) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

export function toDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateKey(dateKey) {
  const [year, month, day] = String(dateKey).split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function formatMonthYear(date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

export function formatShortDate(date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Formats a 24h "HH:mm" time string to "08:00 AM".
 *
 * @param {string} time24
 * @returns {string}
 */
export function formatScheduleTime(time24) {
  if (!time24) return ''
  const [hoursRaw, minutes = '00'] = String(time24).split(':')
  let hours = Number(hoursRaw)
  if (Number.isNaN(hours)) return String(time24)

  const period = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  if (hours === 0) hours = 12
  return `${String(hours).padStart(2, '0')}:${minutes} ${period}`
}

/**
 * Converts a 24h "HH:mm" string to minutes since midnight.
 *
 * @param {string} time24
 * @returns {number}
 */
export function parseTimeMinutes(time24) {
  if (!time24) return -1
  const [hoursRaw, minutesRaw] = String(time24).split(':')
  const hours = Number(hoursRaw)
  const minutes = Number(minutesRaw)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return -1
  return hours * 60 + minutes
}

/**
 * True when two time intervals [aStart, aEnd) and [bStart, bEnd) overlap.
 * Intervals that only touch at a boundary are NOT considered overlapping.
 *
 * @param {string} aStart
 * @param {string} aEnd
 * @param {string} bStart
 * @param {string} bEnd
 * @returns {boolean}
 */
export function timesOverlap(aStart, aEnd, bStart, bEnd) {
  const a0 = parseTimeMinutes(aStart)
  const a1 = parseTimeMinutes(aEnd)
  const b0 = parseTimeMinutes(bStart)
  const b1 = parseTimeMinutes(bEnd)
  if ([a0, a1, b0, b1].some((value) => value < 0)) return false
  return a0 < b1 && b0 < a1
}

/**
 * Formats a start/end time range, e.g. "9:00 AM – 11:00 AM".
 *
 * @param {string} startTime
 * @param {string} endTime
 * @returns {string}
 */
export function formatEventTimeRange(startTime, endTime) {
  const start = formatScheduleTime(startTime)
  const end = formatScheduleTime(endTime)
  if (!start && !end) return ''
  if (!end) return start
  if (!start) return end
  return `${start} – ${end}`
}

/**
 * Formats a calendar event's time display, preferring its duration range
 * when available and falling back to the legacy single time field.
 *
 * @param {object} event
 * @returns {string}
 */
export function formatEventDateTimeRange(event) {
  if (event?.startTime && event?.endTime) {
    return formatEventTimeRange(event.startTime, event.endTime)
  }
  return formatScheduleTime(event?.time)
}

export function getEventDateKey(event) {
  if (event?.dateKey) {
    const key = String(event.dateKey).trim().slice(0, 10)
    if (/^\d{4}-\d{2}-\d{2}$/.test(key)) return key
  }
  if (!event?.date) return ''

  if (typeof event.date?.toDate === 'function') {
    return toDateKey(event.date.toDate())
  }

  if (event.date instanceof Date) {
    return toDateKey(event.date)
  }

  if (typeof event.date === 'string') {
    const key = event.date.trim().slice(0, 10)
    if (/^\d{4}-\d{2}-\d{2}$/.test(key)) return key
  }

  return ''
}

/**
 * True when dateKey is strictly before today's local calendar date.
 * Today and future return false. Time-of-day is ignored.
 */
export function isPastDateKey(dateKey, now = new Date()) {
  const key = String(dateKey || '').trim().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false
  return key < toDateKey(now)
}

/** True when the event is scheduled before today (local calendar date). */
export function isPastEvent(event, now = new Date()) {
  return isPastDateKey(getEventDateKey(event), now)
}

export function getEventTime(event) {
  return String(event?.startTime || event?.time || '').trim()
}

export function getEventsForDate(events, date) {
  const key = toDateKey(startOfDay(date))
  return [...events]
    .filter((event) => getEventDateKey(event) === key)
    .sort((a, b) => getEventTime(a).localeCompare(getEventTime(b)))
}

export function getDatesWithEvents(events) {
  return new Set(
    events.map((event) => getEventDateKey(event)).filter(Boolean),
  )
}

/**
 * Upcoming events after the selected day (exclusive).
 */
export function getUpcomingEvents(events, fromDate, limit = 4) {
  const fromKey = toDateKey(startOfDay(fromDate))

  return [...events]
    .filter((event) => getEventDateKey(event) > fromKey)
    .sort((a, b) => {
      const byDate = getEventDateKey(a).localeCompare(getEventDateKey(b))
      if (byDate !== 0) return byDate
      return getEventTime(a).localeCompare(getEventTime(b))
    })
    .slice(0, limit)
}

/**
 * Builds a user-friendly schedule conflict message.
 *
 * @param {object} overlappingEvent
 * @returns {string}
 */
export function formatEventConflictMessage(overlappingEvent) {
  const title = overlappingEvent?.title || 'another event'
  const timeRange = formatEventDateTimeRange(overlappingEvent) || 'the selected time'
  const dateText = overlappingEvent?.date
    ? overlappingEvent.date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'this date'

  return `This event overlaps with '${title}' scheduled from ${timeRange} on ${dateText}. Please choose another time.`
}

export function getCalendarCells(viewDate) {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startWeekday = firstOfMonth.getDay()

  const cells = []

  for (let i = 0; i < startWeekday; i += 1) {
    cells.push(null)
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day))
  }

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return cells
}
