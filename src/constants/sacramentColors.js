/** Calendar color coding by sacrament source. */
export const SACRAMENT_COLORS = {
  baptism: '#1565C0',
  confirmation: '#2E7D32',
  marriage: '#6A1B9A',
  death: '#616161',
  conversion: '#EF6C00',
  massIntention: '#00838F',
  manual: '#0B3D91',
}

export function getSacramentColor(source) {
  return SACRAMENT_COLORS[source] || SACRAMENT_COLORS.manual
}
