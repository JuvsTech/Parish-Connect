import { COLLECTIONS } from './collections'
import {
  formatBaptismRecordNumber,
  formatConfirmationRecordNumber,
  formatConversionRecordNumber,
  formatDeathRecordNumber,
  formatMarriageRecordNumber,
  formatMassIntentionRecordNumber,
} from '../utils/recordNumber'
import {
  formatPersonName,
  getChildDisplayName,
  getConfirmandDisplayName,
  getConvertDisplayName,
  getDeceasedDisplayName,
  getOfferedForDisplayName,
} from '../utils/personName'
import { formatFirestoreDate } from '../utils/date'
import { getRequirementsSummary } from './sacramentRequirements'
import { PARISH_TIME_OPTIONS } from './parishTimes'

function formatReportTime(value) {
  const raw = String(value || '').trim()
  const match = PARISH_TIME_OPTIONS.find((item) => item.value === raw)
  return match?.label || raw || '—'
}

function createMassIntentionReportType({
  value,
  label,
  title,
  filePrefix,
  statusFilter = null,
}) {
  return {
    value,
    label,
    assignment: '',
    collection: COLLECTIONS.MASS_INTENTIONS,
    dateField: 'massDate',
    ministerFields: ['celebrantName'],
    statusFilter,
    title,
    filePrefix,
    worksheetName: 'Mass Intentions',
    formatRecordNumber: formatMassIntentionRecordNumber,
    columns: [
      { key: 'recordNumber', label: 'Intention Number' },
      { key: 'personName', label: 'Offered For' },
      { key: 'sacramentDate', label: 'Mass Date' },
      { key: 'massTime', label: 'Mass Time' },
      { key: 'intentionType', label: 'Intention Type' },
      { key: 'minister', label: 'Celebrant' },
      { key: 'status', label: 'Status' },
    ],
    mapRow(doc) {
      return {
        id: doc.id,
        recordNumber:
          String(doc.intentionNumber || '').trim() ||
          formatMassIntentionRecordNumber(doc.recordYear, doc.recordNumber),
        recordNumberSort: Number(doc.recordNumber) || 0,
        personName: getOfferedForDisplayName(doc),
        sacramentDate: formatFirestoreDate(doc.massDate),
        sacramentDateValue: doc.massDate,
        massTime: formatReportTime(doc.massTime),
        intentionType: String(doc.intentionType || '').trim() || '—',
        minister: String(doc.celebrantName || '').trim() || '—',
        status: String(doc.status || '').trim() || '—',
      }
    },
  }
}

function requirementsStatusLabel(sacrament, requirements) {
  const summary = getRequirementsSummary(sacrament, requirements)
  return summary.status === 'complete'
    ? '✔ Complete'
    : `⚠ Incomplete (${summary.submitted} of ${summary.total} Submitted)`
}

/** Church identity used on PDF / print headers. */
export const PARISH_NAME =
  'Immaculate Conception of the Virgin Mary Parish'
export const PARISH_LOCATION = 'Bani, Pangasinan'

/**
 * Canonical report-type keys used by filters, services, and exports.
 * Labels match the approved Reports UI options.
 */
export const REPORT_TYPE_OPTIONS = [
  {
    value: 'baptism',
    label: 'Baptism',
    assignment: 'Baptism',
    collection: COLLECTIONS.BAPTISM,
    dateField: 'baptismDate',
    ministerFields: ['minister'],
    title: 'Baptism Records Report',
    filePrefix: 'Baptism_Report',
    worksheetName: 'Baptism Records',
    formatRecordNumber: formatBaptismRecordNumber,
    columns: [
      { key: 'recordNumber', label: 'Record Number' },
      { key: 'personName', label: 'Child Name' },
      { key: 'sacramentDate', label: 'Baptism Date' },
      { key: 'minister', label: 'Minister' },
      { key: 'requirementsStatus', label: 'Requirements Status' },
    ],
    mapRow(doc) {
      return {
        id: doc.id,
        recordNumber: formatBaptismRecordNumber(doc.recordYear, doc.recordNumber),
        recordNumberSort: Number(doc.recordNumber) || 0,
        personName: getChildDisplayName(doc),
        sacramentDate: formatFirestoreDate(doc.baptismDate),
        sacramentDateValue: doc.baptismDate,
        minister: String(doc.minister || '').trim() || '—',
        requirementsStatus: requirementsStatusLabel(
          'baptism',
          doc.requirements,
        ),
      }
    },
  },
  {
    value: 'confirmation',
    label: 'Confirmation',
    assignment: 'Confirmation',
    collection: COLLECTIONS.CONFIRMATION,
    dateField: 'confirmationDate',
    ministerFields: ['minister'],
    title: 'Confirmation Records Report',
    filePrefix: 'Confirmation_Report',
    worksheetName: 'Confirmation Records',
    formatRecordNumber: formatConfirmationRecordNumber,
    columns: [
      { key: 'recordNumber', label: 'Record Number' },
      { key: 'personName', label: 'Confirmand Name' },
      { key: 'sacramentDate', label: 'Confirmation Date' },
      { key: 'minister', label: 'Minister' },
      { key: 'requirementsStatus', label: 'Requirements Status' },
    ],
    mapRow(doc) {
      return {
        id: doc.id,
        recordNumber: formatConfirmationRecordNumber(
          doc.recordYear,
          doc.recordNumber,
        ),
        recordNumberSort: Number(doc.recordNumber) || 0,
        personName: getConfirmandDisplayName(doc),
        sacramentDate: formatFirestoreDate(doc.confirmationDate),
        sacramentDateValue: doc.confirmationDate,
        minister: String(doc.minister || '').trim() || '—',
        requirementsStatus: requirementsStatusLabel(
          'confirmation',
          doc.requirements,
        ),
      }
    },
  },
  {
    value: 'marriage',
    label: 'Marriage',
    assignment: 'Marriage',
    collection: COLLECTIONS.MARRIAGE,
    dateField: 'marriageDate',
    ministerFields: ['minister', 'officiatingMinister'],
    title: 'Marriage Records Report',
    filePrefix: 'Marriage_Report',
    worksheetName: 'Marriage Records',
    formatRecordNumber: formatMarriageRecordNumber,
    columns: [
      { key: 'recordNumber', label: 'Record Number' },
      { key: 'groom', label: 'Groom' },
      { key: 'bride', label: 'Bride' },
      { key: 'sacramentDate', label: 'Marriage Date' },
      { key: 'minister', label: 'Minister' },
      { key: 'requirementsStatus', label: 'Requirements Status' },
    ],
    mapRow(doc) {
      const groom = formatPersonName({
        firstName: doc.groomFirstName,
        middleName: doc.groomMiddleName,
        lastName: doc.groomLastName,
        suffix: doc.groomSuffix,
      })
      const bride = formatPersonName({
        firstName: doc.brideFirstName,
        middleName: doc.brideMiddleName,
        lastName: doc.brideLastName,
        suffix: doc.brideSuffix,
      })
      return {
        id: doc.id,
        recordNumber: formatMarriageRecordNumber(
          doc.recordYear,
          doc.recordNumber,
        ),
        recordNumberSort: Number(doc.recordNumber) || 0,
        personName: `${groom} / ${bride}`,
        groom,
        bride,
        sacramentDate: formatFirestoreDate(doc.marriageDate),
        sacramentDateValue: doc.marriageDate,
        minister:
          String(doc.minister || doc.officiatingMinister || '').trim() || '—',
        requirementsStatus: requirementsStatusLabel(
          'marriage',
          doc.requirements,
        ),
      }
    },
  },
  {
    value: 'death',
    label: 'Death',
    assignment: 'Burial',
    collection: COLLECTIONS.DEATH,
    dateField: 'burialDate',
    ministerFields: ['minister', 'officiatingMinister'],
    title: 'Death Records Report',
    filePrefix: 'Death_Report',
    worksheetName: 'Death Records',
    formatRecordNumber: formatDeathRecordNumber,
    columns: [
      { key: 'recordNumber', label: 'Record Number' },
      { key: 'personName', label: 'Deceased Name' },
      { key: 'sacramentDate', label: 'Burial Date' },
      { key: 'minister', label: 'Minister' },
      { key: 'requirementsStatus', label: 'Requirements Status' },
    ],
    mapRow(doc) {
      return {
        id: doc.id,
        recordNumber: formatDeathRecordNumber(doc.recordYear, doc.recordNumber),
        recordNumberSort: Number(doc.recordNumber) || 0,
        personName: getDeceasedDisplayName(doc),
        sacramentDate: formatFirestoreDate(doc.burialDate),
        sacramentDateValue: doc.burialDate,
        minister:
          String(doc.minister || doc.officiatingMinister || '').trim() || '—',
        requirementsStatus: requirementsStatusLabel(
          'death',
          doc.requirements,
        ),
      }
    },
  },
  {
    value: 'conversion',
    label: 'Conversion',
    assignment: 'Conversion',
    collection: COLLECTIONS.CONVERSION,
    dateField: 'dateOfReception',
    ministerFields: ['receivingMinister', 'minister'],
    title: 'Conversion Records Report',
    filePrefix: 'Conversion_Report',
    worksheetName: 'Conversion Records',
    formatRecordNumber: formatConversionRecordNumber,
    columns: [
      { key: 'recordNumber', label: 'Record Number' },
      { key: 'personName', label: 'Convert Name' },
      { key: 'sacramentDate', label: 'Reception Date' },
      { key: 'minister', label: 'Minister' },
      { key: 'requirementsStatus', label: 'Requirements Status' },
    ],
    mapRow(doc) {
      return {
        id: doc.id,
        recordNumber: formatConversionRecordNumber(
          doc.recordYear,
          doc.recordNumber,
        ),
        recordNumberSort: Number(doc.recordNumber) || 0,
        personName: getConvertDisplayName(doc),
        sacramentDate: formatFirestoreDate(doc.dateOfReception),
        sacramentDateValue: doc.dateOfReception,
        minister:
          String(doc.receivingMinister || doc.minister || '').trim() || '—',
        requirementsStatus: requirementsStatusLabel(
          'conversion',
          doc.requirements,
        ),
      }
    },
  },
  createMassIntentionReportType({
    value: 'massIntention',
    label: 'Monthly Mass Intentions',
    title: 'Monthly Mass Intentions Report',
    filePrefix: 'Mass_Intention_Monthly_Report',
  }),
  createMassIntentionReportType({
    value: 'massIntentionDaily',
    label: 'Daily Mass Intentions',
    title: 'Daily Mass Intentions Report',
    filePrefix: 'Mass_Intention_Daily_Report',
  }),
  createMassIntentionReportType({
    value: 'massIntentionWeekly',
    label: 'Weekly Mass Intentions',
    title: 'Weekly Mass Intentions Report',
    filePrefix: 'Mass_Intention_Weekly_Report',
  }),
  createMassIntentionReportType({
    value: 'massIntentionPending',
    label: 'Pending Intentions',
    title: 'Pending Mass Intentions Report',
    filePrefix: 'Mass_Intention_Pending_Report',
    statusFilter: 'Pending',
  }),
  createMassIntentionReportType({
    value: 'massIntentionScheduled',
    label: 'Scheduled Intentions',
    title: 'Scheduled Mass Intentions Report',
    filePrefix: 'Mass_Intention_Scheduled_Report',
    statusFilter: 'Scheduled',
  }),
  createMassIntentionReportType({
    value: 'massIntentionOffered',
    label: 'Offered Intentions',
    title: 'Offered Mass Intentions Report',
    filePrefix: 'Mass_Intention_Offered_Report',
    statusFilter: 'Offered',
  }),
]

export function getReportTypeConfig(value) {
  return (
    REPORT_TYPE_OPTIONS.find((item) => item.value === value) ||
    REPORT_TYPE_OPTIONS[0]
  )
}

export function getReportTypeLabel(value) {
  return getReportTypeConfig(value).label
}

/** Month select options — first entry means no month filter. */
export const REPORT_MONTH_OPTIONS = [
  'All Months',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function monthLabelToIndex(label) {
  const index = REPORT_MONTH_OPTIONS.indexOf(label)
  return index > 0 ? index - 1 : null
}

export function buildReportYearOptions(span = 10) {
  const current = new Date().getFullYear()
  const years = []
  for (let i = 0; i < span; i += 1) {
    years.push(String(current - i))
  }
  return years
}
