import { addDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { createAuditLog } from './auditLogService'
import { getImportConfig, mapImportRow } from './sacramentImportConfig'

export const MAX_IMPORT_ROWS = 1000
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024
const identity = record => {
  const year = Number(record?.recordYear), number = Number(record?.recordNumber)
  return Number.isInteger(year) && year >= 1000 && Number.isInteger(number) && number > 0 ? `${year}:${number}` : null
}
const registry = record => {
  const book = String(record?.bookNumber || '').trim().toUpperCase()
  const line = Number(record?.lineNumber), page = Number(record?.pageNumber)
  return book && Number.isInteger(line) && line > 0 && Number.isInteger(page) && page > 0 ? `${book}:${page}:${line}` : null
}
export function markImportConflicts(rows, existing) {
  const ids = new Set(existing.map(identity).filter(Boolean))
  const refs = new Set(existing.map(registry).filter(Boolean))
  const counts = new Map(), refCounts = new Map()
  for (const row of rows) {
    const data = row.document || row.values
    for (const [key, map] of [[identity(data), counts], [registry(data), refCounts]]) if (key) map.set(key, (map.get(key) || 0) + 1)
  }
  return rows.map(row => {
    if (row.errors.length) return { ...row, state: 'Invalid', reasons: row.errors }
    const key = identity(row.document), ref = registry(row.document)
    const reasons = []
    if (ids.has(key)) reasons.push('Record Number + Year already exists (including archived records).')
    if (counts.get(key) > 1) reasons.push('Record Number + Year is repeated in this workbook; all matching rows are skipped.')
    if (ref && refs.has(ref)) reasons.push('Book + Page + Line already exists.')
    if (ref && refCounts.get(ref) > 1) reasons.push('Book + Page + Line is repeated in this workbook.')
    return { ...row, state: reasons.length ? 'Conflict' : 'Valid', reasons }
  })
}
export function dateCell(value) {
  if (!value) return ''
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime()) || value.getUTCHours() || value.getUTCMinutes() || value.getUTCSeconds()) throw new Error('Enter a date without a time.')
    value = value.toISOString().slice(0, 10)
  }
  const text = String(value).trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error('Use YYYY-MM-DD or a real Excel date.')
  const parsed = new Date(text + 'T00:00:00Z')
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== text) throw new Error('Invalid calendar date.')
  return text
}
export function readImportCell(cell, column) {
  const value = cell.value
  if (value == null || value === '') return ''
  if (column.type === 'date') return dateCell(value)
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') throw new Error('Use plain values, not formulas, links, errors or formatted objects.')
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Invalid number.')
  const text = String(value).trim()
  if (column.type === 'number' && text && (!/^\d+$/.test(text) || !Number.isSafeInteger(Number(text)))) throw new Error('Use a whole number without separators (within the supported numeric range).')
  return text
}
async function excel() {
  const module = await import('exceljs')
  return module.default || module
}
export async function createImportWorkbook(module) {
  const config = getImportConfig(module)
  const Excel = await excel()
  const workbook = new Excel.Workbook()
  const sheet = workbook.addWorksheet('Records', { views: [{ state: 'frozen', ySplit: 1 }] })
  sheet.columns = config.columns.map(column => ({ header: column.header, key: column.key, width: Math.min(36, Math.max(22, column.label.length)) }))
  sheet.getRow(1).height = 44
  sheet.getRow(1).eachCell(cell => { cell.font = { bold: true }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F4F8' } }; cell.alignment = { vertical: 'middle', wrapText: true } })
  config.columns.forEach((column, i) => { sheet.getColumn(i + 1).numFmt = column.type === 'date' ? 'yyyy-mm-dd' : column.type === 'number' ? '0' : '@' })
  const instructions = workbook.addWorksheet('Instructions')
  instructions.columns = [{ width: 48 }, { width: 100 }]
  instructions.addRows([
    ['PARISH CONNECT', `${config.title} Records Bulk Import Template`],
    ['Instructions', 'One old parish record per row. Do not rename headers. Required columns have *. Leave optional or unavailable information blank. Review the Preview before confirming. Do not enter system IDs or technical information.'],
    ['Historical records only', 'Use past sacrament dates. No Calendar events or appointments are created. No scheduled or completed status is assigned to historical Baptisms.'],
    ['Limits', `Up to ${MAX_IMPORT_ROWS} records and 5 MB per file. Split larger files.`],
    ['Registry', 'Copy Record No. and Record Year from the book. Book No. uses Roman numerals. Line and Page are optional positive whole numbers.'],
    ['Names', 'Enter the complete name. Preview shows how given names and surname will be saved. All words before the surname are kept together as given names; no middle name is guessed. For an unusual surname, you may use Surname, Given Names. Check every name before confirming.'],
    ['Places', 'Enter Barangay, City / Municipality, Province. Region is optional. Example: Poblacion, Bani, Pangasinan. If a place cannot be matched safely, the row is flagged for review; the address is not shortened.'],
    ['Dates', 'Use YYYY-MM-DD or real Excel dates without a time.'],
    ...(module === 'marriage' ? [['Age and occupation', 'Ages are calculated from Birth Date and Marriage Date, as in the record form. Enter occupations in plain words.']] : []),
    ...(config.columns.some(c => c.type === 'people') ? [['Godparents / Sponsors', 'Use a semicolon between people. Example: Mark Juven Neypes; Renz Dela Cruz; Ana Reyes. Leave blank if unavailable. Godparent residences are not required.']] : []),
    ['Duplicates', 'Existing (including archived) Record Number + Year and full Book + Page + Line references are checked. Repeated workbook identities are all skipped. Names alone do not imply duplication.'],
    [], ['Column', 'Required / format / allowed values'],
    ...config.columns.map(c => [c.header, `${c.required ? 'Required' : 'Optional'}. ${c.help || ''}${c.options ? ' Allowed: ' + c.options.join(', ') : ''}`]),
  ])
  instructions.eachRow(row => { row.alignment = { vertical: 'top', wrapText: true }; row.height = Math.max(36, Math.ceil(Math.max(String(row.getCell(1).value || '').length / 44, String(row.getCell(2).value || '').length / 90)) * 16 + 12) })
  instructions.getRow(1).font = { bold: true, size: 14 }
  return workbook
}
export async function downloadImportTemplate(module) {
  const config = getImportConfig(module)
  const workbook = await createImportWorkbook(module)
  const buffer = await workbook.xlsx.writeBuffer()
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  const link = document.createElement('a')
  link.href = url; link.download = `${config.title}_Record_Import_Template.xlsx`; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export async function parseImportWorkbook(module, buffer) {
  const config = getImportConfig(module)
  const Excel = await excel()
  const workbook = new Excel.Workbook()
  const { prepareWorkbookForExcelJs } = await import('./excelWorkbookCompatibility')
  await workbook.xlsx.load(await prepareWorkbookForExcelJs(buffer))
  const sheet = workbook.getWorksheet('Records')
  if (!sheet) throw new Error(`Use the ${config.title} template with its original worksheet name.`)
  if (sheet.actualColumnCount !== config.columns.length || config.columns.some((c,i) => sheet.getRow(1).getCell(i+1).value !== c.header)) throw new Error('Headers are missing, renamed, reordered or unsupported. Download a fresh template.')
  if (sheet.rowCount > MAX_IMPORT_ROWS + 1) throw new Error(`Use at most ${MAX_IMPORT_ROWS} worksheet rows per file.`)
  const rows = []
  sheet.eachRow((row, index) => {
    if (index === 1 || !row.values.some(value => value != null && String(value).trim())) return
    const values = {}, errors = []
    config.columns.forEach((column, i) => {
      try { values[column.key] = readImportCell(row.getCell(i + 1), column) }
      catch (error) { values[column.key] = ''; errors.push(`${column.label}: ${error.message}`) }
    })
    let mapped
    try { mapped = mapImportRow(config, values) }
    catch (error) { mapped = { document: null, errors: [error.message || 'Malformed row.'] } }
    rows.push({ rowNumber: index, values, document: mapped.document, mapping: mapped.mapping, errors: [...errors, ...mapped.errors] })
  })
  if (!rows.length) throw new Error('The spreadsheet has no records.')
  return rows
}
async function existingRecords(config) {
  // Include retained/archived records, as the existing manual numbering checks do.
  const snapshot = await getDocs(collection(db, config.collection))
  return snapshot.docs.map(item => item.data())
}
export async function previewImport(module, file) {
  if (!/\.xlsx$/i.test(file.name)) throw new Error('Select an .xlsx file.')
  if (file.size > MAX_IMPORT_BYTES) throw new Error('File exceeds 5 MB. Split it into smaller files.')
  const rows = await parseImportWorkbook(module, await file.arrayBuffer())
  return markImportConflicts(rows, await existingRecords(getImportConfig(module)))
}
export async function saveHistoricalImport(module, previewRows, onProgress = () => {}) {
  const config = getImportConfig(module)
  // Revalidate and reread immediately before writes; never trust stale preview eligibility.
  const refreshed = previewRows.map(row => {
    if (row.errors.length || row.state !== 'Valid') return row
    const mapped = mapImportRow(config, row.values)
    return { ...row, ...mapped }
  })
  const checked = markImportConflicts(refreshed, await existingRecords(config))
  const results = []
  for (let index = 0; index < checked.length; index++) {
    const row = checked[index]
    if (row.state !== 'Valid' || previewRows[index].state !== 'Valid') {
      results.push({ ...row, state: previewRows[index].state === 'Conflict' ? 'Conflict' : row.state })
      continue
    }
    try {
      const data = { ...row.document, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
      if (module === 'confirmation') delete data.dateOfBirth
      if ('createdBy' in data) { data.createdBy = auth.currentUser?.email || ''; data.updatedBy = data.createdBy }
      // Intentionally bypass createRecord: it creates events and individual audit entries.
      await addDoc(collection(db, config.collection), data)
      results.push({ ...row, state: 'Imported', reasons: [] })
    } catch (error) {
      results.push({ ...row, state: 'Failed', reasons: [error?.message || 'Firestore write failed.'] })
    }
    onProgress(index + 1, checked.length)
  }
  const summary = { imported: 0, invalid: 0, duplicates: 0, failed: 0 }
  for (const row of results) summary[{ Imported: 'imported', Invalid: 'invalid', Conflict: 'duplicates', Failed: 'failed' }[row.state]]++
  if (summary.imported) await createAuditLog({ action: `Imported ${config.title} Records`, module: config.title, details: `Bulk imported ${summary.imported} historical ${config.title} records from Excel. Invalid: ${summary.invalid}; conflicts: ${summary.duplicates}; failed: ${summary.failed}.` }).catch(() => null)
  return { rows: results, summary }
}
