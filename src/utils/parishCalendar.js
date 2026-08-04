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

export function getEventDateKey(event) {
  if (event?.dateKey) return event.dateKey
  if (!event?.date) return ''

  if (typeof event.date?.toDate === 'function') {
    return toDateKey(event.date.toDate())
  }

  if (event.date instanceof Date) {
    return toDateKey(event.date)
  }

  return ''
}

export function getEventTime(event) {
  return String(event?.time || event?.startTime || '').trim()
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
