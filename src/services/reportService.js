import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { COLLECTIONS, MESSAGES } from '../constants'
import {
  monthLabelToIndex,
  PARISH_NAME,
  REPORT_TYPE_OPTIONS,
} from '../constants/reportTypes'
import { getSacramentalRecordCounts } from './dashboardService'

function reportsRef() {
  return collection(db, COLLECTIONS.REPORTS)
}

function toJsDate(value) {
  if (!value) return null
  if (typeof value?.toDate === 'function') {
    const date = value.toDate()
    return Number.isNaN(date.getTime()) ? null : date
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(
      typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? `${value}T00:00:00`
        : value,
    )
    return Number.isNaN(date.getTime()) ? null : date
  }
  return null
}

function matchesMonth(dateValue, monthIndex) {
  if (monthIndex == null) return true
  const date = toJsDate(dateValue)
  if (!date) return false
  return date.getMonth() === monthIndex
}

function matchesMinister(doc, ministerFields, selectedMinister) {
  if (!selectedMinister) return true
  const target = String(selectedMinister).trim().toLowerCase()
  if (!target) return true
  return ministerFields.some((field) => {
    const value = String(doc[field] || '')
      .trim()
      .toLowerCase()
    return value === target
  })
}

function compareSacramentThenRecord(a, b) {
  const dateA = toJsDate(a.sacramentDateValue)?.getTime() ?? Number.POSITIVE_INFINITY
  const dateB = toJsDate(b.sacramentDateValue)?.getTime() ?? Number.POSITIVE_INFINITY
  if (dateA !== dateB) return dateA - dateB
  return (a.recordNumberSort || 0) - (b.recordNumberSort || 0)
}

export async function getReportYears(reportType) {
  const value = String(reportType || '').trim()
  const config = REPORT_TYPE_OPTIONS.find((item) => item.value === value)
  if (!config) return []

  try {
    const collectionRef = collection(db, config.collection)
    const snapshot = await getDocs(query(collectionRef, orderBy('recordYear', 'desc')))
    const years = new Set()

    snapshot.docs.forEach((docSnap) => {
      const yearValue = docSnap.data()?.recordYear
      const normalized = Number(yearValue)
      if (Number.isInteger(normalized) && normalized >= 1000) {
        years.add(String(normalized))
      }
    })

    return Array.from(years).sort((a, b) => Number(b) - Number(a))
  } catch (error) {
    throw error instanceof Error ? error : new Error(MESSAGES.ERROR.REPORT_GENERATE)
  }
}

/**
 * All-time sacramental totals for Reports summary cards.
 * Independent of report filters.
 */
export async function getReportSummaryCounts() {
  return getSacramentalRecordCounts()
}

/**
 * Query ONLY the selected sacrament collection for the chosen year,
 * then apply optional month / minister filters in memory.
 *
 * @param {{
 *   reportType: string,
 *   year: string|number,
 *   month?: string,
 *   minister?: string,
 *   generatedBy?: string,
 * }} filters
 */
export async function generateSacramentalReport(filters = {}) {
  const reportType = String(filters.reportType || '').trim()
  const year = String(filters.year || '').trim()
  const monthLabel = filters.month || 'All Months'
  const minister = String(filters.minister || '').trim()
  const isAllYears = year === 'All Years'
  const reportYear = Number(year)

  if (!reportType || (!isAllYears && (!Number.isInteger(reportYear) || reportYear < 1000))) {
    throw new Error(MESSAGES.ERROR.REPORT_REQUIRED_FILTERS)
  }

  const config = REPORT_TYPE_OPTIONS.find((item) => item.value === reportType)
  if (!config) {
    throw new Error(MESSAGES.ERROR.REPORT_REQUIRED_FILTERS)
  }

  const monthIndex = monthLabelToIndex(monthLabel)

  try {
    const collectionRef = collection(db, config.collection)
    const snapshot = await getDocs(
      isAllYears
        ? query(collectionRef)
        : query(collectionRef, where('recordYear', '==', reportYear)),
    )

    const rows = snapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .filter((doc) => matchesMonth(doc[config.dateField], monthIndex))
      .filter((doc) =>
        matchesMinister(doc, config.ministerFields, minister),
      )
      .filter((doc) => {
        if (!config.statusFilter) return true
        return (
          String(doc.status || '')
            .trim()
            .toLowerCase() ===
          String(config.statusFilter).trim().toLowerCase()
        )
      })
      .map((doc) => config.mapRow(doc))
      .sort(compareSacramentThenRecord)

    const generatedAt = new Date()
    const summary = {
      reportTitle: config.title,
      reportType: config.label,
      reportTypeValue: config.value,
      year: year || 'All Years',
      month: monthIndex == null ? 'All Months' : monthLabel,
      minister: minister || 'All Ministers',
      generatedBy: String(filters.generatedBy || 'Administrator').trim(),
      generatedAt,
      totalRecords: rows.length,
      parishName: PARISH_NAME,
      columns: config.columns,
      filePrefix: config.filePrefix,
      worksheetName: config.worksheetName,
    }

    return { summary, rows, config }
  } catch (error) {
    if (error instanceof Error && error.message === MESSAGES.ERROR.REPORT_REQUIRED_FILTERS) {
      throw error
    }
    throw new Error(MESSAGES.ERROR.REPORT_GENERATE)
  }
}

/**
 * Client-side search over an already-generated report dataset.
 */
export function filterReportRows(rows = [], searchTerm = '') {
  const term = String(searchTerm || '')
    .trim()
    .toLowerCase()
  if (!term) return rows

  return rows.filter((row) => {
    const haystack = [
      row.recordNumber,
      row.personName,
      row.groom,
      row.bride,
      row.minister,
      row.sacramentDate,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(term)
  })
}

export function buildExportFileName(summary, extension) {
  const prefix = summary.filePrefix || 'Parish_Report'
  const year = summary.year || 'All'
  const month =
    summary.month && summary.month !== 'All Months'
      ? `_${String(summary.month).replace(/\s+/g, '')}`
      : ''
  return `${prefix}_${year}${month}.${extension}`
}

/**
 * Persist report metadata only (never sacramental row copies).
 */
export async function saveReportMetadata({
  summary,
  exportFormat,
  fileName,
  userEmail,
}) {
  try {
    const payload = {
      reportName: `${summary.reportType} Records — ${
        summary.month !== 'All Months'
          ? `${summary.month} ${summary.year}`
          : summary.year
      }`,
      reportType: summary.reportTypeValue,
      reportTypeLabel: summary.reportType,
      generatedBy: summary.generatedBy,
      generatedByEmail: String(userEmail || '').trim(),
      generatedDate: summary.generatedAt.toISOString(),
      format: exportFormat,
      fileName: fileName || '',
      appliedFilters: {
        reportType: summary.reportTypeValue,
        year: summary.year,
        month: summary.month,
        minister: summary.minister,
      },
      totalRecords: summary.totalRecords,
      createdAt: serverTimestamp(),
    }

    const ref = await addDoc(reportsRef(), payload)
    return { id: ref.id, ...payload }
  } catch {
    // Metadata persistence must not block exports.
    return null
  }
}

/**
 * Recent report metadata for the Reports history table.
 */
export async function getRecentReports(max = 25) {
  try {
    const snapshot = await getDocs(
      query(reportsRef(), orderBy('createdAt', 'desc'), limit(max)),
    )

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() || {}
      const generatedDate =
        data.generatedDate ||
        (typeof data.createdAt?.toDate === 'function'
          ? data.createdAt.toDate().toISOString()
          : '')

      return {
        id: docSnap.id,
        reportName: data.reportName || 'Untitled Report',
        reportType: data.reportType || '',
        generatedBy: data.generatedBy || data.generatedByEmail || '—',
        generatedDate,
        format: data.format || '—',
        fileName: data.fileName || '',
        appliedFilters: data.appliedFilters || null,
        totalRecords: Number(data.totalRecords) || 0,
      }
    })
  } catch {
    throw new Error(MESSAGES.ERROR.REPORT_RECENT_LOAD)
  }
}

export function formatReportGeneratedOn(date) {
  const value = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(value.getTime())) return '—'

  const datePart = value.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const timePart = value.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
  return { datePart, timePart, display: `${datePart}\n${timePart}` }
}
