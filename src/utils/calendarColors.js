import { getSacramentColor } from '../constants/sacramentColors'
import { getEventDateKey } from './parishCalendar'

/** Map dateKey -> unique sacrament source colors for that day. */
export function getDateSourceColors(events = []) {
  const map = new Map()

  events.forEach((event) => {
    const key = getEventDateKey(event)
    if (!key) return
    const source = event.source || 'manual'
    const color = getSacramentColor(source)
    const existing = map.get(key) || []
    if (!existing.includes(color)) {
      existing.push(color)
      map.set(key, existing)
    }
  })

  return map
}
